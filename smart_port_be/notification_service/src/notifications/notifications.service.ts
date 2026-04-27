import { Injectable } from '@nestjs/common';
import {
  NotificationListResponse,
  NotificationRecord,
  NotificationSeverity,
} from './notifications.types';

type CreateNotificationInput = {
  title: string;
  detail: string;
  severity: NotificationSeverity;
  sourceEvent: string;
};

@Injectable()
export class NotificationsService {
  private readonly notifications: NotificationRecord[] = [];

  add(input: CreateNotificationInput): NotificationRecord {
    const entry: NotificationRecord = {
      id: this.createId(),
      title: input.title,
      detail: input.detail,
      severity: input.severity,
      sourceEvent: input.sourceEvent,
      time: new Date().toISOString(),
      read: false,
    };

    this.notifications.unshift(entry);

    if (this.notifications.length > 500) {
      this.notifications.pop();
    }

    return entry;
  }

  list(limit?: number, severity?: NotificationSeverity, unreadOnly?: boolean): NotificationListResponse {
    const normalizedLimit = this.normalizeLimit(limit);

    const filtered = this.notifications.filter((item) => {
      if (severity && item.severity !== severity) {
        return false;
      }
      if (unreadOnly && item.read) {
        return false;
      }
      return true;
    });

    return {
      notifications: filtered.slice(0, normalizedLimit),
      total: filtered.length,
      unread: filtered.filter((item) => !item.read).length,
    };
  }

  markAsRead(id: string): NotificationRecord | null {
    const target = this.notifications.find((item) => item.id === id);
    if (!target) {
      return null;
    }

    target.read = true;
    return target;
  }

  markAllAsRead(): number {
    let updated = 0;

    this.notifications.forEach((item) => {
      if (!item.read) {
        item.read = true;
        updated += 1;
      }
    });

    return updated;
  }

  private normalizeLimit(limit?: number): number {
    if (!limit || Number.isNaN(limit) || limit <= 0) {
      return 50;
    }
    return Math.min(limit, 200);
  }

  private createId(): string {
    return `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
