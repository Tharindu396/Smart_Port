"use client";

import { DashboardLayout } from "@/app/components/DashboardLayout";
import {
  Button,
  Card,
  Chip,
  Tab,
  Tabs,
  ProgressBar as Progress,
} from "@heroui/react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ship,
  TrendingUp,
  MapPin,
  Zap,
  Users,
  BarChart3,
} from "lucide-react";

// Mock data
const kpis = [
  {
    icon: Ship,
    label: "Active Vessels",
    value: "47",
    change: "+3 today",
    trend: "up",
  },
  {
    icon: Clock,
    label: "Avg. Turnaround",
    value: "4.2h",
    change: "-0.5h vs avg",
    trend: "down",
  },
  {
    icon: Zap,
    label: "Port Utilization",
    value: "78%",
    change: "+5% this week",
    trend: "up",
  },
  {
    icon: AlertTriangle,
    label: "Pending Issues",
    value: "2",
    change: "1 critical",
    trend: "neutral",
  },
];

const vesselStatus = [
  {
    id: "v-001",
    name: "MV Horizon Star",
    imo: "9876543",
    type: "Container Ship",
    eta: "14:30 Today",
    status: "Approaching",
    position: "2.5 nm away",
    color: "primary",
  },
  {
    id: "v-002",
    name: "Bulk Carrier Alpha",
    imo: "9765432",
    type: "Bulk Carrier",
    eta: "Tomorrow 08:00",
    status: "Enroute",
    position: "45 nm away",
    color: "success",
  },
  {
    id: "v-003",
    name: "Tanker Beta",
    imo: "9654321",
    type: "Tanker",
    eta: "02:15 (Delayed)",
    status: "Delayed",
    position: "38 nm away",
    color: "warning",
  },
  {
    id: "v-004",
    name: "General Cargo Vessel",
    imo: "9543210",
    type: "General Cargo",
    eta: "Scheduled 18:00",
    status: "Berthed",
    position: "Berth 3",
    color: "success",
  },
];

const recentActivity = [
  {
    id: "a-001",
    vessel: "Container Venture",
    action: "Completed loading",
    time: "5 min ago",
    type: "success",
  },
  {
    id: "a-002",
    vessel: "Bulk Express",
    action: "Started unloading",
    time: "12 min ago",
    type: "info",
  },
  {
    id: "a-003",
    vessel: "Ocean Pioneer",
    action: "Waiting in anchorage",
    time: "28 min ago",
    type: "warning",
  },
  {
    id: "a-004",
    vessel: "Port Authority",
    action: "System maintenance window",
    time: "1 hr ago",
    type: "neutral",
  },
];

function getTrendIcon(trend: string) {
  if (trend === "up") return <TrendingUp size={16} className="text-success" />;
  if (trend === "down") return <TrendingUp size={16} className="text-danger rotate-180" />;
  return <Activity size={16} className="text-default-400" />;
}

export default function DashboardPage() {
  return (
    <DashboardLayout defaultActiveKey="dashboard" pageTitle="Dashboard">
      <section className="space-y-6">
        {/* HEADER */}
        <header className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold">Port Operations Overview</h2>
          <p className="text-sm text-default-500">
            Real-time monitoring of vessel arrivals, port utilization, and operational metrics
          </p>
        </header>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <Card key={idx} className="bg-linear-to-br from-content2 to-default-50">
                <Card.Content className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase text-default-500">{kpi.label}</p>
                        <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(kpi.trend)}
                    <span className="text-xs text-default-500">{kpi.change}</span>
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* VESSEL STATUS - MAIN */}
          <Card className="xl:col-span-2">
            <Card.Header className="flex justify-between">
              <div>
                <Card.Title>Active Vessel Traffic</Card.Title>
                <Card.Description>Live tracking and ETA management</Card.Description>
              </div>
              <Chip color="success">
                <Activity size={12} />
                Live
              </Chip>
            </Card.Header>

            <Card.Content className="space-y-3">
              {vesselStatus.map((vessel) => (
                <div
                  key={vessel.id}
                  className="rounded-lg border border-divider bg-content2/50 p-4 transition-colors hover:bg-content2"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{vessel.name}</h4>
                      <p className="text-xs text-default-500">IMO: {vessel.imo}</p>
                    </div>
                    <Chip
                      color={vessel.color as any}
                      size="sm"
                    >
                      {vessel.status}
                    </Chip>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-default-500">Type</p>
                      <p className="font-medium text-foreground">{vessel.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-default-500">ETA</p>
                      <p className="font-medium text-foreground">{vessel.eta}</p>
                    </div>
                    <div>
                      <p className="text-xs text-default-500">Position</p>
                      <p className="font-medium text-foreground flex items-center gap-1">
                        <MapPin size={12} />
                        {vessel.position}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </Card.Content>
          </Card>

          {/* QUICK STATS */}
          <div className="space-y-4">
            {/* OPERATIONS STATUS */}
            <Card>
              <Card.Header>
                <Card.Title>Operations Status</Card.Title>
              </Card.Header>

              <Card.Content className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Berths Occupied</p>
                    <p className="text-sm font-bold">8/12</p>
                  </div>
                  <Progress value={66} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Dock Capacity</p>
                    <p className="text-sm font-bold">78%</p>
                  </div>
                  <Progress value={78} color="warning" className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Equipment Available</p>
                    <p className="text-sm font-bold">35/40</p>
                  </div>
                  <Progress value={87} color="success" className="h-2" />
                </div>
              </Card.Content>
            </Card>

            {/* ALERTS */}
            <Card className="border-l-2 border-l-danger">
              <Card.Header>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-danger" />
                  <Card.Title>Active Alerts</Card.Title>
                </div>
              </Card.Header>

              <Card.Content className="space-y-2">
                <div className="rounded-lg bg-danger/5 p-3 border border-danger-soft-hover">
                  <p className="text-sm font-medium text-foreground">Restricted Zone Breach Risk</p>
                  <p className="text-xs text-default-600">Vessel approaching exclusion boundary</p>
                </div>
                <div className="rounded-lg bg-warning/5 p-3 border border-warning-soft-hover">
                  <p className="text-sm font-medium text-foreground">High Port Utilization</p>
                  <p className="text-xs text-default-600">Capacity at 78% - plan accordingly</p>
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>

        {/* ACTIVITY FEED & RECENT OPERATIONS */}
        <Card>
          <Card.Header className="flex justify-between">
            <div>
              <Card.Title>Recent Activity</Card.Title>
              <Card.Description>
                Latest vessel and port operations
              </Card.Description>
            </div>
            <Button size="sm" variant="secondary">
              View All
            </Button>
          </Card.Header>

          <Card.Content className="p-0">
            <Tabs className="w-full" variant="secondary">

              {/* Tabs Header */}
              <Tabs.ListContainer className="px-4 pt-3">
                <Tabs.List aria-label="Activity filters">
                  <Tabs.Tab id="all">
                    All Activity
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="arrivals">
                    Arrivals
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="departures">
                    Departures
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>

              {/* ALL ACTIVITY */}
              <Tabs.Panel id="all" className="pt-4">
                <div className="space-y-2 p-4">
                  {recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-divider p-3 hover:bg-content2/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-full p-2 ${
                            item.type === "success"
                              ? "bg-success/10"
                              : item.type === "warning"
                              ? "bg-warning/10"
                              : "bg-primary/10"
                          }`}
                        >
                          {item.type === "success" ? (
                            <CheckCircle2 size={16} className="text-success" />
                          ) : item.type === "warning" ? (
                            <AlertTriangle size={16} className="text-warning" />
                          ) : (
                            <Activity size={16} className="text-primary" />
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-medium">
                            {item.vessel}
                          </p>
                          <p className="text-xs text-default-500">
                            {item.action}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-default-400" />
                        <span className="text-xs text-default-500">
                          {item.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Tabs.Panel>

              {/* ARRIVALS */}
              <Tabs.Panel id="arrivals" className="pt-4">
                <div className="p-4 text-sm text-default-500">
                  Showing arrival events for the past 24 hours.
                </div>
              </Tabs.Panel>

              {/* DEPARTURES */}
              <Tabs.Panel id="departures" className="pt-4">
                <div className="p-4 text-sm text-default-500">
                  Showing departure events for the past 24 hours.
                </div>
              </Tabs.Panel>

            </Tabs>
          </Card.Content>
        </Card>

        {/* FOOTER STATS */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <Card.Content>
              <div className="flex items-center gap-2">
                <Ship size={16} className="text-primary" />
                <div>
                  <p className="text-xs text-default-500">In Port</p>
                  <p className="text-lg font-bold">12</p>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content>
              <div className="flex items-center gap-2">
                <Users size={16} className="text-success" />
                <div>
                  <p className="text-xs text-default-500">Operators</p>
                  <p className="text-lg font-bold">8</p>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content>
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-warning" />
                <div>
                  <p className="text-xs text-default-500">Capacity</p>
                  <p className="text-lg font-bold">78%</p>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-danger" />
                <div>
                  <p className="text-xs text-default-500">On Schedule</p>
                  <p className="text-lg font-bold">44</p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </section>
    </DashboardLayout>
  );
}
