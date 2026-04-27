import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from './config/app.config';
import { ChannelsModule } from './channels/channels.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ChannelsModule,
    KafkaModule,
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppModule {}