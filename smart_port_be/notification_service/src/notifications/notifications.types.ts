export type NotificationSeverity = 'critical' | 'warning' | 'info';

export interface NotificationRecord {
  id: string;
  title: string;
  detail: string;
  severity: NotificationSeverity;
  time: string;
  sourceEvent: string;
  read: boolean;
}

export interface NotificationListResponse {
  notifications: NotificationRecord[];
  total: number;
  unread: number;
}
