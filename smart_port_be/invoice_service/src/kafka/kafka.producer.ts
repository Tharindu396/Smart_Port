import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import {
  InvoiceCreatedEvent,
  InvoicePaidEvent,
  PenaltyAppliedEvent,
  InvoiceCancelledEvent,
} from './kafka.events';
import { KAFKA_TOPICS_OUTBOUND } from './kafka.topics';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private producer: Producer;

  constructor(private readonly configService: ConfigService) {
    const kafka = new Kafka({
      clientId: this.configService.get<string>('kafka.clientId'),
      brokers: this.configService.get<string[]>('kafka.brokers'),
    });
    this.producer = kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log('Kafka Producer connected');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  // ─── Outbound Event Emitters ───────────────────────────────────────────────

  async emitInvoiceCreated(event: InvoiceCreatedEvent): Promise<void> {
    await this.send(KAFKA_TOPICS_OUTBOUND.INVOICE_CREATED, event.vessel_id, event);
    this.logger.log(`Emitted invoice.created for vessel ${event.vessel_id}`);
  }

  async emitInvoicePaid(event: InvoicePaidEvent): Promise<void> {
    await this.send(KAFKA_TOPICS_OUTBOUND.INVOICE_PAID, event.vessel_id, event);
    this.logger.log(`Emitted invoice.paid for vessel ${event.vessel_id}`);
  }

  async emitPenaltyApplied(event: PenaltyAppliedEvent): Promise<void> {
    await this.send(KAFKA_TOPICS_OUTBOUND.PENALTY_APPLIED, event.visitId, event);
    this.logger.log(`Emitted invoice.penalty_applied for vessel ${event.visitId}, penalty $${event.penaltyAmount}`);
  }

  async emitInvoiceCancelled(event: InvoiceCancelledEvent): Promise<void> {
    await this.send(KAFKA_TOPICS_OUTBOUND.INVOICE_CANCELLED, event.vessel_id, event);
    this.logger.log(`Emitted invoice.cancelled for vessel ${event.vessel_id}`);
  }

  // Internal Helper 

  private async send(topic: string, key: string, payload: object): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key,
            value: JSON.stringify(payload),
          },
        ],
      });
    } catch (error) {
      this.logger.error(`Failed to send message to topic ${topic}: ${error.message}`);
      throw error;
    }
  }
}