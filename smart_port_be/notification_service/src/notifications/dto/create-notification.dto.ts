import { IsIn, IsOptional, IsString } from 'class-validator';
import { NotificationSeverity } from '../notification.types';

export class CreateNotificationDto {
  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsIn(['critical', 'warning', 'info'])
  severity!: NotificationSeverity;

  @IsOptional()
  @IsString()
  recipientRole?: string;

  @IsOptional()
  @IsString()
  eventType?: string;
}
