export type NotificationSeverity = 'critical' | 'warning' | 'info';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  severity: NotificationSeverity;
  unread: boolean;
  createdAt: Date;
  recipientRole?: string;
  eventType?: string;
}
