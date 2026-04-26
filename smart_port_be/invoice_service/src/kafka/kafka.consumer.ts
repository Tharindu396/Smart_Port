// src/kafka/kafka.consumer.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka, EachMessagePayload } from 'kafkajs';
import { InvoiceService } from '../invoice/invoice.service';
import { KAFKA_TOPICS_INBOUND } from './kafka.topics';
import { VesselDepartedEvent, VesselOverstayedEvent } from './kafka.events';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumer: Consumer;

  constructor(
    private readonly configService: ConfigService,
    private readonly invoiceService: InvoiceService,
  ) {
    const kafka = new Kafka({
      clientId: this.configService.get<string>('kafka.clientId'),
      brokers: this.configService.get<string[]>('kafka.brokers'),
    });

    this.consumer = kafka.consumer({
      groupId: this.configService.get<string>('kafka.groupId'),
    });
  }

  async onModuleInit() {
    await this.consumer.connect();

    await this.consumer.subscribe({
      topics: [
        KAFKA_TOPICS_INBOUND.BERTH_RESERVATIONS,   // "berth-reservations"
        KAFKA_TOPICS_INBOUND.PAYMENT_UPDATES,       // "payment.updates"
        KAFKA_TOPICS_INBOUND.VESSEL_DEPARTED,       // "vessel.departed"
        KAFKA_TOPICS_INBOUND.VESSEL_OVERSTAYED,     // "vessel.overstayed"
      ],
      fromBeginning: false,
    });

    this.logger.log('Kafka Consumer started. Listening on:');
    this.logger.log(`    ${KAFKA_TOPICS_INBOUND.BERTH_RESERVATIONS}  ← Go emits key=vesselID, value="RESERVED"`);
    this.logger.log(`    ${KAFKA_TOPICS_INBOUND.PAYMENT_UPDATES}     ← Go emits key=vesselID, value="SUCCESS"|"FAILURE"`);
    this.logger.log(`    ${KAFKA_TOPICS_INBOUND.VESSEL_DEPARTED}     ← Tracking emits JSON`);
    this.logger.log(`    ${KAFKA_TOPICS_INBOUND.VESSEL_OVERSTAYED}   ← Tracking emits JSON`);

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.dispatch(payload);
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }

  // MESSAGE ROUTER

  private async dispatch({ topic, message }: EachMessagePayload): Promise<void> {
    const key = message.key?.toString();
    const value = message.value?.toString();

    if (!value) {
      this.logger.warn(`Empty message on topic ${topic}, key=${key}`);
      return;
    }

    this.logger.debug(`[${topic}] key=${key} value=${value}`);

    try {
      switch (topic) {

        // berth-reservations 
        // Go emits: key = vesselID, value = "RESERVED"
        case KAFKA_TOPICS_INBOUND.BERTH_RESERVATIONS: {
          if (value.trim() === 'RESERVED') {
            await this.invoiceService.handleBerthReserved(key);
          } else {
            this.logger.warn(`Unknown signal on berth-reservations: "${value}"`);
          }
          break;
        }

        // payment.updates
        // Go emits: key = vesselID, value = "SUCCESS" | "FAILURE"
        case KAFKA_TOPICS_INBOUND.PAYMENT_UPDATES: {
          const status = value.trim().replace(/"/g, '');
          if (status === 'SUCCESS') {
            await this.invoiceService.handlePaymentSuccess(key);
          } else if (status === 'FAILURE') {
            await this.invoiceService.handlePaymentFailure(key);
          } else {
            this.logger.warn(`Unknown payment status: "${status}" for vessel ${key}`);
          }
          break;
        }

        // vessel.departed 
        // Vessel Tracking emits JSON
        case KAFKA_TOPICS_INBOUND.VESSEL_DEPARTED: {
          const event: VesselDepartedEvent = JSON.parse(value);
          await this.invoiceService.handleVesselDeparted(event);
          break;
        }

        // vessel.overstayed 
        // Vessel Tracking emits JSON
        case KAFKA_TOPICS_INBOUND.VESSEL_OVERSTAYED: {
          const event: VesselOverstayedEvent = JSON.parse(value);
          await this.invoiceService.handleVesselOverstayed(event);
          break;
        }

        default:
          this.logger.warn(`Unhandled topic: ${topic}`);
      }
    } catch (error) {
      // Never crash the consumer — log and continue
      // Production improvement: push to a Dead Letter Queue topic
      this.logger.error(
        `Error handling [${topic}] key=${key}: ${error.message}`,
        error.stack,
      );
    }
  }
}