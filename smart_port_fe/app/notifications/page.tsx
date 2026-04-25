"use client";

import { DashboardLayout } from "@/app/components/DashboardLayout";
import {
  Button,
  Card,
  CardHeader,
  Chip,
  Tab,
  Tabs,
} from "@heroui/react";
import { Bell, CheckCircle2, Clock3, Siren, TriangleAlert } from "lucide-react";

type Notice = {
  id: string;
  title: string;
  detail: string;
  severity: "critical" | "warning" | "info";
  time: string;
  unread?: boolean;
};

const alerts: Notice[] = [
  {
    id: "n-001",
    title: "Vessel ETA Updated",
    detail: "MV Horizon Star arrival moved to 17:45 due to wind advisory.",
    severity: "info",
    time: "2 min ago",
    unread: true,
  },
  {
    id: "n-002",
    title: "Restricted Zone Breach",
    detail: "Unknown vessel entered Sector C exclusion radius.",
    severity: "critical",
    time: "8 min ago",
    unread: true,
  },
  {
    id: "n-003",
    title: "Fuel Dock Throughput High",
    detail: "Fuel Dock 2 crossed 90% utilization threshold.",
    severity: "warning",
    time: "31 min ago",
  },
  {
    id: "n-004",
    title: "Daily Sync Complete",
    detail: "Vessel telemetry and billing records synced successfully.",
    severity: "info",
    time: "1 hr ago",
  },
];

function severityColor(level: Notice["severity"]) {
  if (level === "critical") return "danger" as const;
  if (level === "warning") return "warning" as const;
  return "accent" as const;
}

function severityIcon(level: Notice["severity"]) {
  if (level === "critical") return <Siren size={16} />;
  if (level === "warning") return <TriangleAlert size={16} />;
  return <Bell size={16} />;
}

export default function NotificationsPage() {
  const unreadCount = alerts.filter((item) => item.unread).length;

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
            <Button variant="primary">
                <CheckCircle2 />
              Mark All As Read
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card variant="tertiary">
            <Card.Content className="gap-1">
            <p className="text-xs text-default-500">Critical</p>
            <p className="text-2xl font-semibold">1</p>
            <p className="text-xs text-danger">Immediate response required</p>
            </Card.Content>
        </Card>

        <Card variant="secondary">
            <Card.Content className="gap-1">
            <p className="text-xs text-default-500">Warnings</p>
            <p className="text-2xl font-semibold">3</p>
            <p className="text-xs text-warning">Review within this shift</p>
            </Card.Content>
        </Card>

        <Card variant="default">
            <Card.Content className="gap-1">
            <p className="text-xs text-default-500">Resolved Today</p>
            <p className="text-2xl font-semibold">14</p>
            <p className="text-xs text-success">Up 12% from yesterday</p>
            </Card.Content>
        </Card>
        </div>

       <Card variant="default">
            <Card.Header className="flex justify-between items-center">
                <Card.Title>Recent Activity</Card.Title>
                <Button size="sm" variant="secondary">
                <Clock3 size={14} />
                Last 24 hours
                </Button>
            </Card.Header>

            <Card.Content className="p-0">
                <Tabs className="w-full" variant="secondary">

                {/* Tabs Header */}
                <Tabs.ListContainer className="px-4 pt-3">
                    <Tabs.List aria-label="Notification filters">
                    <Tabs.Tab id="all">
                        All
                        <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="critical">
                        Critical
                        <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="resolved">
                        Resolved
                        <Tabs.Indicator />
                    </Tabs.Tab>
                    </Tabs.List>
                </Tabs.ListContainer>

                {/* ALL TAB */}
                <Tabs.Panel id="all" className="pt-4">
                    <div className="space-y-3 p-4">
                    {alerts.map((item) => (
                        <article
                        key={item.id}
                        className="rounded-xl border border-divider bg-content2/40 p-4 hover:bg-content2"
                        >
                        <div className="mb-2 flex justify-between">
                            <div className="flex gap-2">
                            <Chip color={severityColor(item.severity)}>
                                {item.severity}
                            </Chip>
                            {item.unread && (
                                <Chip size="sm" color="accent">
                                New
                                </Chip>
                            )}
                            </div>
                            <span className="text-xs text-default-500">
                            {item.time}
                            </span>
                        </div>

                        <h3 className="text-sm font-semibold">
                            {item.title}
                        </h3>
                        <p className="text-sm text-default-600 mt-1">
                            {item.detail}
                        </p>

                        <div className="mt-3 flex gap-2">
                            <Button size="sm" variant="primary">
                            View Details
                            </Button>
                            <Button size="sm" variant="secondary">
                            Dismiss
                            </Button>
                        </div>
                        </article>
                    ))}
                    </div>
                </Tabs.Panel>

                {/* CRITICAL TAB */}
                <Tabs.Panel id="critical" className="pt-4">
                    <div className="p-4 space-y-3">
                    {alerts
                        .filter((item) => item.severity === "critical")
                        .map((item) => (
                        <article
                            key={item.id}
                            className="rounded-xl border border-danger/30 bg-danger/5 p-4"
                        >
                            <h3 className="text-sm font-semibold text-danger">
                            {item.title}
                            </h3>
                            <p className="text-sm mt-1">
                            {item.detail}
                            </p>
                        </article>
                        ))}
                    </div>
                </Tabs.Panel>

                {/* RESOLVED TAB */}
                <Tabs.Panel id="resolved" className="pt-4">
                    <div className="p-4 text-sm text-default-500">
                    No resolved notifications in this view yet.
                    </div>
                </Tabs.Panel>

                </Tabs>
            </Card.Content>
            </Card>
      </section>
    </DashboardLayout>
  );
}
