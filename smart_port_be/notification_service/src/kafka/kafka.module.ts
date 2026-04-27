import { Module } from '@nestjs/common';
import { ChannelsModule } from '../channels/channels.module';
import { EventsConsumer } from './events.consumer';

@Module({
  imports: [ChannelsModule],
  controllers: [EventsConsumer],
})
export class KafkaModule {}
