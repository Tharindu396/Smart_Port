import { Module } from '@nestjs/common';
import { ChannelsModule } from '../channels/channels.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventsConsumer } from './events.consumer';

@Module({
  imports: [ChannelsModule, NotificationsModule],
  controllers: [EventsConsumer],
})
export class KafkaModule {}
