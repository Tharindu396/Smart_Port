import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('vessel_visits')
export class VesselVisit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  vesselId!: string;

  @Column()
  requestedByAgentId!: string;

  @Column()
  vesselName!: string;

  @Column('float')
  length!: number;

  @Column('float')
  depth!: number;

  @Column({ nullable: true })
  manifestFileUrl?: string;

  @Column({ default: 'PENDING_ALLOCATION' })
  status!: string;

  @CreateDateColumn()
  arrivalRequestedAt!: Date;
}
