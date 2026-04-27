import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EmailService } from '../channels/emails.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TemplateLoader } from '../template/template.loader';
import {
  AllocationConfirmedEvent,
  PaymentConfirmedEvent,
  PaymentFailedEvent,
  VesselOverstayedEvent,
  PenaltyTriggerEvent,
} from '../common/interfaces';
import { KAFKA_EVENTS } from '../common/constants';

@Controller()
export class EventsConsumer {
  private readonly logger = new Logger(EventsConsumer.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @EventPattern(KAFKA_EVENTS.ALLOCATION_CONFIRMED)
  async handleAllocationConfirmed(
    @Payload() event: AllocationConfirmedEvent,
  ): Promise<void> {
    this.logger.log(`[ALLOCATION_CONFIRMED] visitId: ${event.visitId}`);

    try {
      const lockExpiry = this.formatTime(new Date(event.lockExpiry));

      const template = TemplateLoader.load(KAFKA_EVENTS.ALLOCATION_CONFIRMED, {
        vesselName: event.vesselName,
        berthName: event.berthName,
        berthId: event.berthId,
        lockExpiry,
      });

      await this.emailService.send({
        to: event.shippingCompanyEmail,
        ...template,
      });

      this.notificationsService.add({
        title: 'Allocation Confirmed',
        detail: `${event.vesselName} allocated to berth ${event.berthName}.`,
        severity: 'info',
        sourceEvent: KAFKA_EVENTS.ALLOCATION_CONFIRMED,
      });
    } catch (err) {
      this.logger.error(
        `[ALLOCATION_CONFIRMED] Failed to process: ${err instanceof Error ? err.message : 'Unknown error'}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }

  @EventPattern(KAFKA_EVENTS.PAYMENT_CONFIRMED)
  async handlePaymentConfirmed(
    @Payload() event: PaymentConfirmedEvent,
  ): Promise<void> {
    this.logger.log(`[PAYMENT_CONFIRMED] visitId: ${event.visitId}`);

    try {
      const template = TemplateLoader.load(KAFKA_EVENTS.PAYMENT_CONFIRMED, {
        vesselName: event.vesselName,
        berthId: event.berthId,
        amount: event.amount.toFixed(2),
        currency: event.currency,
        transactionId: event.transactionId,
        confirmedAt: this.formatDateTime(new Date(event.confirmedAt)),
      });

      await this.emailService.send({
        to: event.shippingCompanyEmail,
        ...template,
      });

      this.notificationsService.add({
        title: 'Payment Confirmed',
        detail: `${event.vesselName} payment ${event.currency} ${event.amount.toFixed(2)} confirmed.`,
        severity: 'info',
        sourceEvent: KAFKA_EVENTS.PAYMENT_CONFIRMED,
      });
    } catch (err) {
      this.logger.error(
        `[PAYMENT_CONFIRMED] Failed to process: ${err instanceof Error ? err.message : 'Unknown error'}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }

  @EventPattern(KAFKA_EVENTS.PAYMENT_FAILED)
  async handlePaymentFailed(
    @Payload() event: PaymentFailedEvent,
  ): Promise<void> {
    this.logger.warn(`[PAYMENT_FAILED] visitId: ${event.visitId}`);

    try {
      const template = TemplateLoader.load(KAFKA_EVENTS.PAYMENT_FAILED, {
        vesselName: event.vesselName,
        reason: event.reason,
      });

      await this.emailService.send({
        to: event.shippingCompanyEmail,
        ...template,
      });

      this.notificationsService.add({
        title: 'Payment Failed',
        detail: `${event.vesselName} payment failed: ${event.reason}`,
        severity: 'warning',
        sourceEvent: KAFKA_EVENTS.PAYMENT_FAILED,
      });
    } catch (err) {
      this.logger.error(
        `[PAYMENT_FAILED] Failed to process: ${err instanceof Error ? err.message : 'Unknown error'}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }

  @EventPattern(KAFKA_EVENTS.VESSEL_OVERSTAYED)
  async handleVesselOverstayed(
    @Payload() event: VesselOverstayedEvent,
  ): Promise<void> {
    this.logger.warn(
      `[VESSEL_OVERSTAYED] ${event.vesselName} overdue by ${event.overdueByMinutes} min`,
    );

    try {
      const overdueHours = (event.overdueByMinutes / 60).toFixed(1);
      const estimatedPenalty = (
        (event.overdueByMinutes / 60) * event.surchargePerHour
      ).toFixed(2);

      const template = TemplateLoader.load(KAFKA_EVENTS.VESSEL_OVERSTAYED, {
        vesselName: event.vesselName,
        berthId: event.berthId,
        overdueHours,
        estimatedPenalty,
        surchargePerHour: event.surchargePerHour.toString(),
        scheduledDeparture: this.formatDateTime(
          new Date(event.scheduledDeparture),
        ),
      });

      await this.emailService.send({
        to: event.shippingCompanyEmail,
        ...template,
      });

      this.notificationsService.add({
        title: 'Vessel Overstayed',
        detail: `${event.vesselName} exceeded schedule by ${overdueHours}h at berth ${event.berthId}.`,
        severity: 'critical',
        sourceEvent: KAFKA_EVENTS.VESSEL_OVERSTAYED,
      });
    } catch (err) {
      this.logger.error(
        `[VESSEL_OVERSTAYED] Failed to process: ${err instanceof Error ? err.message : 'Unknown error'}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }

  @EventPattern(KAFKA_EVENTS.PENALTY_TRIGGER)
  async handlePenaltyTrigger(
    @Payload() event: PenaltyTriggerEvent,
  ): Promise<void> {
    this.logger.warn(`[PENALTY_TRIGGER] visitId: ${event.visitId}`);

    try {
      const template = TemplateLoader.load(KAFKA_EVENTS.PENALTY_TRIGGER, {
        vesselName: event.vesselName,
        penaltyAmount: event.penaltyAmount.toFixed(2),
        currency: event.currency,
        reason: event.reason,
      });

      await this.emailService.send({
        to: event.shippingCompanyEmail,
        ...template,
      });

      this.notificationsService.add({
        title: 'Penalty Triggered',
        detail: `${event.vesselName} penalty ${event.currency} ${event.penaltyAmount.toFixed(2)} triggered.`,
        severity: 'warning',
        sourceEvent: KAFKA_EVENTS.PENALTY_TRIGGER,
      });
    } catch (err) {
      this.logger.error(
        `[PENALTY_TRIGGER] Failed to process: ${err instanceof Error ? err.message : 'Unknown error'}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}