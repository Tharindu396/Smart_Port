import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { InvoiceLineItem } from './invoice-line-item.entity';

export enum InvoiceStatus {
  PENDING = 'PENDING',       // Invoice generated, awaiting payment
  PAID = 'PAID',             // Payment confirmed by Berthing Service
  CANCELLED = 'CANCELLED',   // Payment failed / berth released
  OVERDUE = 'OVERDUE',       // Payment window expired
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Vessel Reference (from Berthing Service) 
  @Column({ name: 'vessel_id' })
  vesselId: string;

  @Column({ name: 'vessel_name' })
  vesselName: string;

  // Berth Allocation Reference 
  @Column({ name: 'allocated_by' })
  allocatedBy: string; // user ID of the Shipping Agent

  @Column({ name: 'slot_ids', type: 'jsonb' })
  slotIds: string[]; // e.g. ["S1", "S2", "S3"]

  @Column({ name: 'slot_count' })
  slotCount: number;

  // Time Details
  @Column({ name: 'arrival_planned', type: 'timestamptz' })
  arrivalPlanned: Date;

  @Column({ name: 'stay_duration_hours', type: 'float' })
  stayDurationHours: number;

  @Column({ name: 'actual_duration_hours', type: 'float', nullable: true })
  actualDurationHours: number;

  @Column({ name: 'docked_at', type: 'timestamptz', nullable: true })
  dockedAt: Date;

  @Column({ name: 'departed_at', type: 'timestamptz', nullable: true })
  departedAt: Date;

  // Financial Details
  @Column({ name: 'base_berth_fee', type: 'decimal', precision: 12, scale: 2 })
  baseBerthFee: number;

  @Column({ name: 'port_fee', type: 'decimal', precision: 12, scale: 2 })
  portFee: number;

  @Column({ name: 'penalty_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  penaltyAmount: number;

  @Column({ name: 'overstay_hours', type: 'float', default: 0 })
  overstayHours: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ name: 'currency', default: 'USD' })
  currency: string;

  // Status 
  @Column({ name: 'status', type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.PENDING })
  status: InvoiceStatus;

  @Column({ name: 'payment_status', type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date;

  @Column({ name: 'due_date', type: 'timestamptz' })
  dueDate: Date;

  @Column({ name: 'notes', nullable: true, type: 'text' })
  notes: string;

  // Relationships 
  @OneToMany(() => InvoiceLineItem, (item) => item.invoice, { cascade: true, eager: true })
  lineItems: InvoiceLineItem[];

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}