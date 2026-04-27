import { Module } from '@nestjs/common';
import { EmailService } from './emails.service';
import { EmailConfigService } from '../config/email.config';

@Module({
  providers: [EmailConfigService, EmailService],
  exports: [EmailService],
})
export class ChannelsModule {}