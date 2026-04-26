import { Module } from '@nestjs/common';
import { KafkaConsumerService } from './kafka.consumer';
import { KafkaProducerService } from './kafka.producer';
import { InvoiceModule } from '../invoice/invoice.module';

@Module({
  imports: [InvoiceModule],
  providers: [KafkaConsumerService, KafkaProducerService],
  exports: [KafkaProducerService],
})
export class KafkaModule {}