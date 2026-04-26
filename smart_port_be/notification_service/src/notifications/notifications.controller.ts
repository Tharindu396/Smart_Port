import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@Query() query: QueryNotificationsDto) {
    return this.notificationsService.list(query.role, query.eventType);
  }

  @Get('unread')
  unread(@Query('role') role?: string) {
    return this.notificationsService.unread(role);
  }

  @Post()
  create(@Body() payload: CreateNotificationDto) {
    return this.notificationsService.create(payload);
  }

  @Patch(':id/read')
  markRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markRead(id);
  }

  @Patch('mark-all-read')
  markAllRead(@Query('role') role?: string) {
    return this.notificationsService.markAllRead(role);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.remove(id);
  }
}
