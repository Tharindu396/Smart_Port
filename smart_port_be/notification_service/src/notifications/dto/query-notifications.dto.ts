import { IsOptional, IsString } from 'class-validator';

export class QueryNotificationsDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  eventType?: string;
}
