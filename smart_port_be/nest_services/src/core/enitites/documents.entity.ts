import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('Documents')
export class Document {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  vessel_id!: number;
  @Column()
  type!: string;
  @Column()
  file_url!: string;
  @Column()
  status!: string;
}