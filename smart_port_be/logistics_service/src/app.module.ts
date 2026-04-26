import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { VesselModule } from './modules/vessel/vessel.module';
import { VesselVisit } from './modules/vessel/entities/vessel-visit.entity';

@Module({
  imports: [
    // 1. Load the .env file
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // 2. Setup the Database Connection
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'logistics_db',
      entities: [VesselVisit],
      synchronize: true, // This creates the table automatically
    }),
    VesselModule,
  ],
})
export class AppModule {}