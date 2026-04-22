import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,ForeignKey } from 'typeorm';
export class Invoice {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  vessel_id!: number;
  @Column()
  amount!: number;
  @Column()
  issued_at!: Date;
  @Column()
  status!: string;
}