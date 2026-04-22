import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
@Entity('Schedules')
export class Schedule {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  vessel_id!: number;
  @Column()
  berth_id!: number;
  @Column()
  start_time!: Date;
  @Column()
  end_time!: Date;
}