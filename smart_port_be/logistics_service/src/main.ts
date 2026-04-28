import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Connect Kafka as a Microservice
  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
      },
      consumer: {
        groupId: 'logistics-consumer-server', // A unique group for logistics consumption
      },
    },
  });

  await app.startAllMicroservices(); // Start Kafka listening
  //await app.listen(process.env.PORT ?? 3000);

  app.enableCors({
    origin: (
      process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(',')
        : ['http://localhost:3000', 'http://127.0.0.1:3000']
    ),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
