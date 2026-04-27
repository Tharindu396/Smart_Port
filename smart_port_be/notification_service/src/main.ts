import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const kafkaBrokers =
    process.env.KAFKA_BROKERS ?? process.env.KAFKA_BROKER_URL ?? 'localhost:9092';
  const brokers = kafkaBrokers
    .split(',')
    .map((broker) => broker.trim())
    .filter((broker) => broker.length > 0);

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: process.env.KAFKA_CLIENT_ID ?? 'notification-service',
        brokers,
      },
      consumer: {
        groupId: process.env.KAFKA_GROUP_ID ?? 'notification-service',
      },
    },
  });
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3010;
  await app.startAllMicroservices();
  await app.listen(port);
}

bootstrap();
