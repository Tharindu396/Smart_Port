import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { appConfig } from './config/app.config';
import { Invoice } from './invoice/entities/invoice.entity';
import { InvoiceLineItem } from './invoice/entities/invoice-line-item.entity';
import { InvoiceModule } from './invoice/invoice.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    // Config 
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        entities: [Invoice, InvoiceLineItem],
        synchronize: true, // Auto-creates tables in dev. Use migrations in prod.
        logging: false,
      }),
      inject: [ConfigService],
    }),

    // Feature Modules 
    InvoiceModule,
    KafkaModule,
  ],
})
export class AppModule {}