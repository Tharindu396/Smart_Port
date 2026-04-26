import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';

export enum LineItemType {
  BERTH_FEE = 'BERTH_FEE',
  PORT_FEE = 'PORT_FEE',
  OVERSTAY_PENALTY = 'OVERSTAY_PENALTY',
  YARD_USAGE = 'YARD_USAGE',
  ADDITIONAL_CHARGE = 'ADDITIONAL_CHARGE',
}

@Entity('invoice_line_items')
export class InvoiceLineItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_id' })
  invoiceId: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.lineItems)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ name: 'type', type: 'enum', enum: LineItemType })
  type: LineItemType;

  @Column({ name: 'description' })
  description: string;

  // e.g. 5.0 (hours), 3 (slots), 1 (flat fee)
  @Column({ name: 'quantity', type: 'float' })
  quantity: number;

  // e.g. "hours", "slots", "flat"
  @Column({ name: 'unit' })
  unit: string;

  // unit price in USD
  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  // quantity * unit_price
  @Column({ name: 'amount', type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}