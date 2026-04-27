"use client";

import { useCallback, useEffect, useState } from "react";
import {
  notificationsApi,
  type NotificationRecord,
  type NotificationSeverity,
} from "@/lib/api";

interface UseNotificationsOptions {
  severity?: NotificationSeverity | "all";
  unreadOnly?: boolean;
  limit?: number;
}

interface UseNotificationsReturn {
  notifications: NotificationRecord[];
  unreadCount: number;
  total: number;
  loading: boolean;
  acting: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await notificationsApi.list({
        limit: options.limit ?? 100,
        severity: options.severity && options.severity !== "all" ? options.severity : undefined,
        unreadOnly: options.unreadOnly,
      });
      setNotifications(response.notifications);
      setUnreadCount(response.unread);
      setTotal(response.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load notifications";
      setError(message);
      setNotifications([]);
      setUnreadCount(0);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [options.limit, options.severity, options.unreadOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const markAsRead = useCallback(async (id: string) => {
    setActing(true);
    setError(null);

    try {
      await notificationsApi.markAsRead(id);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to mark notification as read";
      setError(message);
    } finally {
      setActing(false);
    }
  }, [load]);

  const markAllAsRead = useCallback(async () => {
    setActing(true);
    setError(null);

    try {
      await notificationsApi.markAllAsRead();
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to mark all notifications as read";
      setError(message);
    } finally {
      setActing(false);
    }
  }, [load]);

  return {
    notifications,
    unreadCount,
    total,
    loading,
    acting,
    error,
    refresh: load,
    markAsRead,
    markAllAsRead,
  };
}
