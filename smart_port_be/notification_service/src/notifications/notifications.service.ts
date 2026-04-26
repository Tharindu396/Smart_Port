import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationItem } from './notification.types';

@Injectable()
export class NotificationsService {
  private readonly notifications: NotificationItem[] = [];
  private nextId = 1;

  list(role?: string, eventType?: string): NotificationItem[] {
    return this.notifications.filter((item) => {
      const roleMatch = !role || !item.recipientRole || item.recipientRole === role;
      const eventMatch = !eventType || item.eventType === eventType;
      return roleMatch && eventMatch;
    });
  }

  unread(role?: string): NotificationItem[] {
    return this.list(role).filter((item) => item.unread);
  }

  create(payload: CreateNotificationDto): NotificationItem {
    const notification: NotificationItem = {
      id: this.nextId++,
      title: payload.title,
      message: payload.message,
      severity: payload.severity,
      unread: true,
      createdAt: new Date(),
      recipientRole: payload.recipientRole,
      eventType: payload.eventType,
    };

    this.notifications.unshift(notification);
    return notification;
  }

  markRead(id: number): NotificationItem {
    const notification = this.notifications.find((item) => item.id === id);
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    notification.unread = false;
    return notification;
  }

  markAllRead(role?: string): { updated: number } {
    const targets = this.list(role);
    let updated = 0;

    for (const item of targets) {
      if (item.unread) {
        item.unread = false;
        updated += 1;
      }
    }

    return { updated };
  }

  remove(id: number): { deleted: boolean } {
    const idx = this.notifications.findIndex((item) => item.id === id);
    if (idx === -1) return { deleted: false };

    this.notifications.splice(idx, 1);
    return { deleted: true };
  }
}
