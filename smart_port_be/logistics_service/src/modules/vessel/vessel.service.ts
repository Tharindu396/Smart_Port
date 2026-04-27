import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VesselVisit } from './entities/vessel-visit.entity';
import { CreateVisitDto } from './dto/create-visit.dto';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class VesselService {
  constructor(
    @InjectRepository(VesselVisit)
    private readonly visitRepository: Repository<VesselVisit>,

    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async createVisit(
    dto: CreateVisitDto,
    filePath: string): Promise<VesselVisit> {
    const newVisit = this.visitRepository.create({
      ...dto,
      manifestFileUrl: filePath,
      status: 'PENDING_ALLOCATION',
    });
    
    const savedVisit = await this.visitRepository.save(newVisit);
    console.log(`✅ Master Record Created: ${savedVisit.vesselName} (ID: ${savedVisit.id})`);

    // Publish event to Kafka for berth allocation
    this.kafkaClient.emit('vessel.arrivals', {
      visitId: savedVisit.id,
      vesselId: savedVisit.vesselId,
      vesselName: savedVisit.vesselName,
      agentId: savedVisit.requestedByAgentId,
      dimensions: {
        length: savedVisit.length,
        depth: savedVisit.depth,
      },
    });
    console.log(`📢 Event 'vessel.arrivals' emitted for ${savedVisit.vesselName}`);
    return savedVisit;
  }

  async findAll(): Promise<VesselVisit[]> {
  return await this.visitRepository.find({
    order: { arrivalRequestedAt: 'DESC' },
  });
}

async findOne(id: string): Promise<VesselVisit> {
  const visit = await this.visitRepository.findOne({ where: { id } });
  if (!visit) throw new Error('Visit record not found');
  return visit;
}

async onModuleInit() {
    // This connects the client to the broker when the app starts
    await this.kafkaClient.connect();
  }

async remove(id: string): Promise<void> {
  await this.visitRepository.delete(id);
}
async updateStatus(id: string, status: 'ALLOCATED' | 'REJECTED' | 'CANCELLED'): Promise<VesselVisit> {
  const visit = await this.findOne(id);
  visit.status = status;
  return await this.visitRepository.save(visit);
}
}
