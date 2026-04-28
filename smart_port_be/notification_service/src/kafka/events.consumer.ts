import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EmailService } from '../channels/emails.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TemplateLoader } from '../template/template.loader';
import {
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

  @EventPattern(KAFKA_EVENTS.VESSEL_OVERSTAYED)
  async handleVesselOverstayed(
    @Payload() event: VesselOverstayedEvent,
  ): Promise<void> {
    this.logger.warn(
      `[VESSEL_OVERSTAYED] ${event.vesselName} overdue by ${event.overdueByMinutes} min`,
    );


    try {
      const overdueHours = (event.overdueByMinutes / 60).toFixed(1)|| '5.0';
      const surchargePerHour = event.surchargePerHour || 500;
      const estimatedPenalty = (
         Number(overdueHours)* surchargePerHour
      ).toFixed(2);

      const template = TemplateLoader.load(KAFKA_EVENTS.VESSEL_OVERSTAYED, {
        vesselName: event.vesselName,
        VesselID: event.VesselID,
        overdueHours,
        estimatedPenalty,
        surchargePerHour: surchargePerHour.toString(),
        scheduledDeparture: this.formatDateTime(
          new Date(event.scheduledDeparture)|| new Date(),
        ),
      });

      await this.emailService.send({
        to: event.ShippingAgentEmail,
        ...template,
      });

      this.notificationsService.add({
        title: 'Vessel Overstayed',
        detail: `${event.VesselName} exceeded schedule by ${overdueHours}h at berth ${event.VesselID}.`,
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
    const currency = "USD"
    const reason = event.reason || "Penalty triggered due to violation of port regulations.";
    try {
      const template = TemplateLoader.load(KAFKA_EVENTS.PENALTY_TRIGGER, {
        vesselName: event.vessel_name,
        penaltyAmount: event.penalty_amount.toFixed(2),
        currency: currency,
        reason: reason,
      });

      await this.emailService.send({
        to: event.ShippingAgentEmail,
        ...template,
      });

      this.notificationsService.add({
        title: 'Penalty Triggered',
        detail: `${event.vessel_name} penalty ${currency} ${event.penalty_amount.toFixed(2)} triggered.`,
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