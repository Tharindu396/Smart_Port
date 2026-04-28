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
      port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 5436,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [VesselVisit],
      synchronize: true, // This creates the table automatically
    }),
    VesselModule,
  ],
})
export class AppModule {}