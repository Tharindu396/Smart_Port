"use client";

import { DashboardLayout } from "@/app/components/DashboardLayout";
import { useNotifications } from "@/app/hooks/useNotifications";
import { Button, Card, Chip } from "@heroui/react";
import { Bell, CheckCircle2, RefreshCw, Siren, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import type { NotificationSeverity } from "@/lib/api";

type FilterKey = "all" | NotificationSeverity;

function severityColor(level: NotificationSeverity) {
  if (level === "critical") return "danger" as const;
  if (level === "warning") return "warning" as const;
  return "accent" as const;
}

function severityIcon(level: NotificationSeverity) {
  if (level === "critical") return <Siren size={16} />;
  if (level === "warning") return <TriangleAlert size={16} />;
  return <Bell size={16} />;
}

function formatRelativeTime(value: string): string {
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) {
    return "now";
  }

  const seconds = Math.floor((Date.now() - target.getTime()) / 1000);
  if (seconds < 60) {
    return `${Math.max(seconds, 1)} sec ago`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} min ago`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} hr ago`;
  }
  return `${Math.floor(seconds / 86400)} day ago`;
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const {
    notifications,
    unreadCount,
    total,
    loading,
    acting,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
  } = useNotifications({
    severity: filter,
    unreadOnly: showUnreadOnly,
    limit: 100,
  });

  const criticalCount = useMemo(
    () => notifications.filter((item) => item.severity === "critical").length,
    [notifications],
  );

  const warningCount = useMemo(
    () => notifications.filter((item) => item.severity === "warning").length,
    [notifications],
  );

  const resolvedToday = useMemo(
    () => notifications.filter((item) => item.read).length,
    [notifications],
  );

  return (
    <DashboardLayout defaultActiveKey="notifications" pageTitle="Notifications">
      <section className="space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Notification Center</h2>
            <p className="text-sm text-default-500">
              Review critical events, watch operational updates, and clear resolved alerts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Chip color="danger">
              {unreadCount} unread
            </Chip>
            <Button variant="secondary" onPress={refresh} isPending={loading}>
              <RefreshCw size={16} />
              Refresh
            </Button>
            <Button variant="primary" onPress={markAllAsRead} isPending={acting || loading} isDisabled={unreadCount === 0}>
              <CheckCircle2 size={16} />
              Mark All As Read
            </Button>
          </div>
        </header>

        {error && (
          <Card>
            <Card.Content className="text-sm text-danger-600">{error}</Card.Content>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card variant="tertiary">
            <Card.Content className="gap-1">
            <p className="text-xs text-default-500">Critical</p>
            <p className="text-2xl font-semibold">{criticalCount}</p>
            <p className="text-xs text-danger">Immediate response required</p>
            </Card.Content>
        </Card>

        <Card variant="secondary">
            <Card.Content className="gap-1">
            <p className="text-xs text-default-500">Warnings</p>
            <p className="text-2xl font-semibold">{warningCount}</p>
            <p className="text-xs text-warning">Review within this shift</p>
            </Card.Content>
        </Card>

        <Card variant="default">
            <Card.Content className="gap-1">
            <p className="text-xs text-default-500">Resolved Today</p>
            <p className="text-2xl font-semibold">{resolvedToday}</p>
            <p className="text-xs text-success">Read notifications in current view</p>
            </Card.Content>
        </Card>
        </div>

        <Card variant="default">
          <Card.Header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Card.Title>Recent Activity</Card.Title>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="h-9 rounded-lg border border-divider bg-content1 px-3 text-sm text-foreground outline-none transition focus:border-primary"
                value={filter}
                onChange={(event) => setFilter(event.target.value as FilterKey)}
              >
                <option value="all">All severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
              <Button size="sm" variant={showUnreadOnly ? "primary" : "secondary"} onPress={() => setShowUnreadOnly((prev) => !prev)}>
                {showUnreadOnly ? "Unread Only" : "Show Unread"}
              </Button>
              <Chip size="sm" variant="soft">{total} records</Chip>
            </div>
          </Card.Header>

          <Card.Content className="space-y-3 p-4">
            {loading ? (
              <div className="rounded-lg border border-divider p-4 text-sm text-default-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-lg border border-divider p-4 text-sm text-default-500">
                No notifications found for the selected filters.
              </div>
            ) : (
              notifications.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-divider bg-content2/40 p-4 transition-colors hover:bg-content2"
                >
                  <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                      <Chip color={severityColor(item.severity)}>
                        <span className="inline-flex items-center gap-1">
                          {severityIcon(item.severity)}
                          {item.severity}
                        </span>
                      </Chip>
                      {!item.read && (
                        <Chip size="sm" color="accent">
                          New
                        </Chip>
                      )}
                    </div>
                    <span className="text-xs text-default-500">{formatRelativeTime(item.time)}</span>
                  </div>

                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-default-600">{item.detail}</p>
                  <p className="mt-1 text-xs text-default-500">Source: {item.sourceEvent}</p>

                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onPress={() => markAsRead(item.id)}
                      isDisabled={item.read}
                      isPending={acting}
                    >
                      {item.read ? "Read" : "Mark As Read"}
                    </Button>
                  </div>
                </article>
              ))
            )}
          </Card.Content>
        </Card>
      </section>
    </DashboardLayout>
  );
}
