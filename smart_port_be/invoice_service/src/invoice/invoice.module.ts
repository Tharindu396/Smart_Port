import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceLineItem } from './entities/invoice-line-item.entity';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { TariffService } from './tariff.service';
import { BerthingClient } from './berthing.client';
import { KafkaProducerService } from '../kafka/kafka.producer';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceLineItem])],
  providers: [InvoiceService, TariffService, BerthingClient, KafkaProducerService],
  controllers: [InvoiceController],
  exports: [InvoiceService],
})
export class InvoiceModule {}