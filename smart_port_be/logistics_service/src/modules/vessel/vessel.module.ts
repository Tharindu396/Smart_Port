import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Add these
import { VesselController } from './vessel.controller';
import { VesselService } from './vessel.service';
import { VesselVisit } from './entities/vessel-visit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([VesselVisit]),
    // Register Kafka Client Asynchronously
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              // This pulls directly from your .env safely
              brokers: [configService.get<string>('KAFKA_BROKERS') || 'localhost:9092'],
            },
            consumer: {
              groupId: 'logistics-producer-group',
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [VesselController],
  providers: [VesselService],
})
export class VesselModule {}