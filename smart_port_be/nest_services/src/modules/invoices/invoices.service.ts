import { Injectable, BadRequestException } from '@nestjs/common';
import { Invoice } from '../../core/enitites/invoices.entity';
import { SchedulesService } from '../schedules/schedules.service';
import { StatusService } from '../status/status.service';
import { InvoiceStatus } from '../status/status.enum';

@Injectable()
export class InvoicesService {

  private invoices: Invoice[] = [];
  private idCounter = 1;

  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly statusService: StatusService,
  ) {}

  getInvoices(): Invoice[] {
    return this.invoices;
  }

  // MAIN LOGIC
  createInvoice(data: any): Invoice {

    const {
      vessel_id,
      berth_id,
      start_time,
      end_time,
      amount,
    } = data;

    // CHECK AVAILABILITY
    const isAvailable = this.schedulesService.checkAvailability(
      berth_id,
      new Date(start_time),
      new Date(end_time),
    );

    if (!isAvailable) {
      throw new BadRequestException('Berth not available');
    }

    // CREATE INVOICE
    const invoice: Invoice = {
      id: this.idCounter++,
      vessel_id,
      amount,
      issued_at: new Date(),

      // STATUS FROM STATUS SERVICE
      status: this.statusService.getInitialStatus(),
    };

    this.invoices.push(invoice);

    return invoice;
  }

  deleteInvoice(id: number): { deleted: boolean } {
    const index = this.invoices.findIndex(i => i.id === id);

    if (index !== -1) {
      this.invoices.splice(index, 1);
      return { deleted: true };
    }

    return { deleted: false };
  }

  // UPDATE STATUS
  markAsPaid(id: number): Invoice {
    const invoice = this.invoices.find(i => i.id === id);

    if (!invoice) {
      throw new BadRequestException('Invoice not found');
    }

    invoice.status = this.statusService.markPaid();

    return invoice;
  }
}