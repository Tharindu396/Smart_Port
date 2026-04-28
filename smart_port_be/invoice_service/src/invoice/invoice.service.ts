import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus, PaymentStatus } from './entities/invoice.entity';
import { InvoiceLineItem } from './entities/invoice-line-item.entity';
import { TariffService } from './tariff.service';
import { BerthingClient } from './berthing.client';
import { KafkaProducerService } from '../kafka/kafka.producer';
import {
  VesselDepartedEvent,
  VesselOverstayedEvent,
} from '../kafka/kafka.events';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,

    @InjectRepository(InvoiceLineItem)
    private readonly lineItemRepo: Repository<InvoiceLineItem>,

    private readonly tariffService: TariffService,
    private readonly berthingClient: BerthingClient,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  // EVENT HANDLERS

  // HANDLER 1: berth-reservations topic

  async handleBerthReserved(vesselId: string): Promise<void> {
    this.logger.log(`[berth-reservations] vessel=${vesselId} signal=RESERVED`);

    // Guard: skip if a pending invoice already exists for this vessel
    const existing = await this.invoiceRepo.findOne({
      where: { vesselId, status: InvoiceStatus.PENDING },
    });
    if (existing) {
      this.logger.warn(
        `Invoice already exists for vessel ${vesselId} (id=${existing.id}) — skipping duplicate`,
      );
      return;
    }

    // Fetch full allocation details from Berthing Service HTTP API
    // Retry up to 3 times with a short delay — the history write may lag slightly
    const allocation = await this.retryFetchAllocation(vesselId, 3, 1500);

    if (!allocation) {
      this.logger.error(
        `Could not fetch allocation for vessel ${vesselId} after retries. Invoice NOT created.`,
      );
      return;
    }

    // slot_ids gives us slot count. The history entry doesn't include stay_duration,
    // so we use a configurable default — the Finance Officer can adjust it later via API.
    // In production the Logistics Service would publish this detail.
    const slotCount = allocation.slot_ids.length;
    const stayDurationHours = 24; // sensible default; overridden when vessel.departed fires

    const tariff = this.tariffService.calculateInitialCharges(slotCount, stayDurationHours);

    // Payment window matches the 30-min Neo4j lock
    const allocatedAt = new Date(allocation.allocated_at);
    const dueDate = new Date(allocatedAt.getTime() + 30 * 60 * 1000);

    const invoice = this.invoiceRepo.create({
      vesselId: allocation.vessel_id,
      vesselName: allocation.vessel_name,
      allocatedBy: allocation.allocated_by,
      slotIds: allocation.slot_ids,
      slotCount,
      stayDurationHours,
      arrivalPlanned: allocatedAt,
      baseBerthFee: tariff.baseBerthFee,
      portFee: tariff.portFee,
      penaltyAmount: 0,
      overstayHours: 0,
      totalAmount: tariff.totalAmount,
      currency: 'USD',
      status: InvoiceStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      dueDate,
    });

    const saved = await this.invoiceRepo.save(invoice);

    const lineItemEntities = tariff.lineItems.map((item) =>
      this.lineItemRepo.create({ ...item, invoiceId: saved.id }),
    );
    await this.lineItemRepo.save(lineItemEntities);

    this.logger.log(
      `Invoice ${saved.id} created — vessel=${vesselId}, slots=${slotCount}, total=$${tariff.totalAmount} USD`,
    );

    await this.kafkaProducer.emitInvoiceCreated({
      invoice_id: saved.id,
      vessel_id: saved.vesselId,
      vessel_name: saved.vesselName,
      total_amount: Number(saved.totalAmount),
      currency: saved.currency,
      due_date: saved.dueDate.toISOString(),
      created_at: saved.createdAt.toISOString(),
    });
  }

  // HANDLER 2: payment.updates → "SUCCESS"
  
  async handlePaymentSuccess(vesselId: string): Promise<void> {
    this.logger.log(`[payment.updates] vessel=${vesselId} status=SUCCESS`);

    const invoice = await this.findPendingInvoiceByVessel(vesselId);

    invoice.status = InvoiceStatus.PAID;
    invoice.paymentStatus = PaymentStatus.PAID;
    invoice.paidAt = new Date();
    await this.invoiceRepo.save(invoice);

    this.logger.log(`Invoice ${invoice.id} marked PAID for vessel ${vesselId}`);

    await this.kafkaProducer.emitInvoicePaid({
      invoice_id: invoice.id,
      vessel_id: vesselId,
      paid_at: invoice.paidAt.toISOString(),
    });
  }

  // HANDLER 3: payment.updates → "FAILURE"

  async handlePaymentFailure(vesselId: string): Promise<void> {
    this.logger.log(`[payment.updates] vessel=${vesselId} status=FAILURE`);

    const invoice = await this.findPendingInvoiceByVessel(vesselId);

    invoice.status = InvoiceStatus.CANCELLED;
    invoice.notes = 'Cancelled — payment failed, berth reservation released by Berthing Service';
    await this.invoiceRepo.save(invoice);

    this.logger.log(`Invoice ${invoice.id} cancelled for vessel ${vesselId}`);

    await this.kafkaProducer.emitInvoiceCancelled({
      invoice_id: invoice.id,
      vessel_id: vesselId,
      reason: 'Payment failure',
      cancelled_at: new Date().toISOString(),
    });
  }

  // HANDLER 4: vessel.departed
 
  async handleVesselDeparted(event: VesselDepartedEvent): Promise<void> {
    this.logger.log(
      `[vessel.departed] vessel=${event.vessel_id}, actual_duration=${event.actual_duration_hours}h`,
    );

    const invoice = await this.invoiceRepo.findOne({
      where: [
        { vesselId: event.vessel_id, status: InvoiceStatus.PAID },
        { vesselId: event.vessel_id, status: InvoiceStatus.PENDING },
      ],
    });

    if (!invoice) {
      this.logger.warn(`No active invoice for departed vessel ${event.vessel_id}`);
      return;
    }

    invoice.actualDurationHours = event.actual_duration_hours;
    invoice.dockedAt = new Date(event.docked_at);
    invoice.departedAt = new Date(event.departed_at);
    await this.invoiceRepo.save(invoice);

    this.logger.log(`Invoice ${invoice.id} updated with departure data`);
  }

  // HANDLER 5: vessel.overstayed

  async handleVesselOverstayed(event: VesselOverstayedEvent): Promise<void> {
    this.logger.log(
      `[vessel.overstayed] vessel=${event.vessel_id}, overstay=${event.overstay_hours}h`,
    );

    const invoice = await this.invoiceRepo.findOne({
      where: [
        { vesselId: event.vessel_id, status: InvoiceStatus.PAID },
        { vesselId: event.vessel_id, status: InvoiceStatus.PENDING },
      ],
    });

    if (!invoice) {
      this.logger.warn(`No active invoice for overstayed vessel ${event.vessel_id}`);
      return;
    }

    const { penaltyAmount, lineItem } = this.tariffService.calculateOverstayPenalty(
      event.overstay_hours,
    );

    await this.lineItemRepo.save(
      this.lineItemRepo.create({ ...lineItem, invoiceId: invoice.id }),
    );

    const newTotal = Number(invoice.totalAmount) + penaltyAmount;
    invoice.penaltyAmount = Number(invoice.penaltyAmount) + penaltyAmount;
    invoice.overstayHours = Number(invoice.overstayHours) + event.overstay_hours;
    invoice.totalAmount = newTotal;
    invoice.notes = `Overstay penalty $${penaltyAmount} applied — ${event.overstay_hours}h past scheduled departure`;
    await this.invoiceRepo.save(invoice);

    this.logger.log(
      `Penalty $${penaltyAmount} applied to invoice ${invoice.id}. New total: $${newTotal}`,
    );

    await this.kafkaProducer.emitPenaltyApplied({
      invoice_id: invoice.id,
      vessel_id: event.vessel_id,
      vessel_name: event.vessel_name,
      penalty_amount: penaltyAmount,
      overstay_hours: event.overstay_hours,
      new_total: newTotal,
    });
  }

  // REST API METHODS (Finance Officer dashboard)

  async findAll(): Promise<Invoice[]> {
    return this.invoiceRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return invoice;
  }

  async findByVesselId(vesselId: string): Promise<Invoice[]> {
    return this.invoiceRepo.find({
      where: { vesselId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: InvoiceStatus): Promise<Invoice[]> {
    return this.invoiceRepo.find({ where: { status }, order: { createdAt: 'DESC' } });
  }

  // PRIVATE HELPERS

  private async findPendingInvoiceByVessel(vesselId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { vesselId, status: InvoiceStatus.PENDING },
    });
    if (!invoice) {
      throw new NotFoundException(`No pending invoice for vessel ${vesselId}`);
    }
    return invoice;
  }

  private async retryFetchAllocation(
    vesselId: string,
    maxAttempts: number,
    delayMs: number,
  ) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const entry = await this.berthingClient.findLatestAllocationByVessel(vesselId);
      if (entry) return entry;

      if (attempt < maxAttempts) {
        this.logger.warn(
          `Attempt ${attempt}/${maxAttempts}: allocation not yet visible for ${vesselId}, retrying in ${delayMs}ms`,
        );
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    return null;
  }

// PAYMENT SIMULATION LOGIC

  async confirmPayment(invoiceId: string) {
    const invoice = await this.findById(invoiceId);

    if (invoice.status !== InvoiceStatus.PENDING) {
      this.logger.warn(`Invoice ${invoiceId} is not PENDING`);
    }

    invoice.status = InvoiceStatus.PAID;
    invoice.paymentStatus = PaymentStatus.PAID;
    invoice.paidAt = new Date();

    await this.invoiceRepo.save(invoice);

  // Notify Berthing Service
    await this.kafkaProducer.emitPaymentUpdate(
      invoice.vesselId,
      'SUCCESS',
    );

    this.logger.log(
      `Payment CONFIRMED → invoice=${invoice.id}, vessel=${invoice.vesselId}`,
    );

    return {
      message: 'Payment confirmed successfully',
      invoice,
    };
  }

  async rejectPayment(invoiceId: string) {
    const invoice = await this.findById(invoiceId);

    if (invoice.status !== InvoiceStatus.PENDING) {
      this.logger.warn(`Invoice ${invoiceId} is not PENDING`);
    }

    invoice.status = InvoiceStatus.CANCELLED;
    invoice.paymentStatus = PaymentStatus.UNPAID;
    invoice.notes = 'Payment rejected (manual simulation)';

    await this.invoiceRepo.save(invoice);

  // Notify Berthing Service
    await this.kafkaProducer.emitPaymentUpdate(
      invoice.vesselId,
      'FAILURE',
    );

    this.logger.log(
      `Payment REJECTED → invoice=${invoice.id}, vessel=${invoice.vesselId}`,
    );

    return {
      message: 'Payment rejected successfully',
      invoice,
    };
  }
}