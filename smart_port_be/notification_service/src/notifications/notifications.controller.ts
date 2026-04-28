import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationListResponse, NotificationSeverity } from './notifications.types';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getAll(
    @Query('limit') limit?: string,
    @Query('severity') severity?: NotificationSeverity,
    @Query('unreadOnly') unreadOnly?: string,
  ): NotificationListResponse {
    const normalizedSeverity = this.parseSeverity(severity);
    const normalizedUnreadOnly = unreadOnly === 'true';
    const normalizedLimit = this.parseLimit(limit);

    return this.notificationsService.list(
      normalizedLimit,
      normalizedSeverity,
      normalizedUnreadOnly,
    );
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    const updated = this.notificationsService.markAsRead(id);

    if (!updated) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    return updated;
  }

  @Post('read-all')
  markAllAsRead() {
    return {
      updated: this.notificationsService.markAllAsRead(),
    };
  }

  private parseSeverity(severity?: string): NotificationSeverity | undefined {
    if (!severity) {
      return undefined;
    }

    if (severity === 'critical' || severity === 'warning' || severity === 'info') {
      return severity;
    }

    return undefined;
  }

  private parseLimit(limit?: string): number | undefined {
    if (!limit) {
      return undefined;
    }

    const parsed = Number.parseInt(limit, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
}
