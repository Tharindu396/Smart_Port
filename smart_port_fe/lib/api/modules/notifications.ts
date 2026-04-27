import { resolveApiBaseUrl } from "@/lib/api/config";
import { requestJson } from "@/lib/api/http";
import type {
  NotificationListResponse,
  NotificationRecord,
  NotificationSeverity,
} from "@/lib/api/types";

const baseUrl = resolveApiBaseUrl("notificationServiceBaseUrl");

type ListOptions = {
  limit?: number;
  severity?: NotificationSeverity;
  unreadOnly?: boolean;
};

function buildListQuery(options: ListOptions): string {
  const params = new URLSearchParams();

  if (options.limit) {
    params.set("limit", String(options.limit));
  }

  if (options.severity) {
    params.set("severity", options.severity);
  }

  if (options.unreadOnly) {
    params.set("unreadOnly", "true");
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export const notificationsApi = {
  list(options: ListOptions = {}): Promise<NotificationListResponse> {
    return requestJson<NotificationListResponse>(`${baseUrl}/notifications${buildListQuery(options)}`);
  },

  markAsRead(id: string): Promise<NotificationRecord> {
    return requestJson<NotificationRecord>(`${baseUrl}/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  markAllAsRead(): Promise<{ updated: number }> {
    return requestJson<{ updated: number }>(`${baseUrl}/notifications/read-all`, {
      method: "POST",
    });
  },
};
