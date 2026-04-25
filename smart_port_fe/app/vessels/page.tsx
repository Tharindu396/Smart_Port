"use client";

import { DashboardLayout } from "@/app/components/DashboardLayout";
import { ApiError, type UserRole, type VesselDto, vesselsApi } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { Button, Card, Chip, Input } from "@heroui/react";
import { Anchor, LocateFixed, RefreshCw, Search, Ship, Timer, Waves } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

type VesselStatus = "at_berth" | "approaching" | "underway" | "idle" | "unknown";

type AccessPolicy = {
  level: "none" | "restricted" | "full";
  description: string;
  showCoordinates: boolean;
  showMovement: boolean;
};

const rolePolicy: Record<UserRole, AccessPolicy> = {
  admin: {
    level: "full",
    description: "Full vessel tracking access for operational control.",
    showCoordinates: true,
    showMovement: true,
  },
  berth_planner: {
    level: "full",
    description: "Full vessel tracking access for berth planning decisions.",
    showCoordinates: true,
    showMovement: true,
  },
  operations_staff: {
    level: "full",
    description: "Full vessel tracking access for terminal operations.",
    showCoordinates: true,
    showMovement: true,
  },
  shipping_agent: {
    level: "restricted",
    description: "Restricted tracking view with location-sensitive fields masked.",
    showCoordinates: false,
    showMovement: true,
  },
  finance_officer: {
    level: "restricted",
    description: "Read-only vessel overview with operationally sensitive fields masked.",
    showCoordinates: false,
    showMovement: false,
  },
};

function normalizeStatus(status?: string): VesselStatus {
  const input = (status ?? "").toLowerCase();

  if (input.includes("berth") || input.includes("moored") || input.includes("docked")) {
    return "at_berth";
  }
  if (input.includes("approach") || input.includes("arrival") || input.includes("anchor")) {
    return "approaching";
  }
  if (input.includes("underway") || input.includes("sailing") || input.includes("transit")) {
    return "underway";
  }
  if (input.includes("idle") || input.includes("stopped") || input.includes("stationary")) {
    return "idle";
  }

  return "unknown";
}

function statusMeta(status: VesselStatus): { label: string; color: "success" | "accent" | "warning" | "default" } {
  switch (status) {
    case "at_berth":
      return { label: "At Berth", color: "success" };
    case "approaching":
      return { label: "Approaching", color: "accent" };
    case "underway":
      return { label: "Underway", color: "warning" };
    case "idle":
      return { label: "Idle", color: "default" };
    default:
      return { label: "Unknown", color: "default" };
  }
}

function formatTimestamp(unixSeconds?: number): string {
  if (!unixSeconds) return "Unknown";

  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString();
}

function formatCoordinate(value?: number): string {
  if (typeof value !== "number") return "N/A";
  return value.toFixed(4);
}

function toTitleCase(input?: string): string {
  if (!input) return "Unknown";
  return input
    .split(/[\s_]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export default function VesselsPage() {
  const [sessionRole, setSessionRole] = useState<UserRole | null>(null);
  const [vessels, setVessels] = useState<VesselDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VesselStatus | "all">("all");

  const policy = useMemo<AccessPolicy | null>(() => {
    if (!sessionRole) return null;
    return rolePolicy[sessionRole];
  }, [sessionRole]);

  const loadVessels = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await vesselsApi.getAll();
      setVessels(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Failed to load vessels");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load vessels");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getSessionUser();
    if (!user) {
      setSessionRole(null);
      setLoading(false);
      return;
    }

    setSessionRole(user.role);
    loadVessels();
  }, []);

  const filteredVessels = useMemo(() => {
    return vessels.filter((vessel) => {
      const vesselStatus = normalizeStatus(vessel.status);

      if (statusFilter !== "all" && vesselStatus !== statusFilter) {
        return false;
      }

      const keyword = search.trim().toLowerCase();
      if (!keyword) return true;

      const haystack = [vessel.name, vessel.mmsi, vessel.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [vessels, statusFilter, search]);

  const totals = useMemo(() => {
    const base = {
      total: vessels.length,
      atBerth: 0,
      approaching: 0,
      underway: 0,
      idle: 0,
    };

    for (const vessel of vessels) {
      const currentStatus = normalizeStatus(vessel.status);
      if (currentStatus === "at_berth") base.atBerth += 1;
      if (currentStatus === "approaching") base.approaching += 1;
      if (currentStatus === "underway") base.underway += 1;
      if (currentStatus === "idle") base.idle += 1;
    }

    return base;
  }, [vessels]);

  return (
    <DashboardLayout defaultActiveKey="vessels" pageTitle="Vessels">
      <section className="space-y-6">
        <header className="rounded-2xl border border-divider bg-linear-to-r from-content2 via-content1 to-primary/5 p-5 md:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Vessel Tracking Overview</h2>
              <p className="mt-1 text-sm text-default-500">
                Monitor active vessels, movement states, and live port-side status in one place.
              </p>
            </div>
            <Button
              variant="secondary"
              onPress={loadVessels}
              isPending={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>
        </header>

        {!sessionRole || !policy ? (
          <Card>
            <Card.Content className="space-y-2">
              <p className="text-lg font-semibold">Login Required</p>
              <p className="text-sm text-default-500">
                Please log in to access vessel tracking data.
              </p>
            </Card.Content>
          </Card>
        ) : policy.level === "none" ? (
          <Card>
            <Card.Content className="space-y-2">
              <p className="text-lg font-semibold">Access Restricted</p>
              <p className="text-sm text-default-500">
                Your role does not have access to vessel tracking data.
              </p>
            </Card.Content>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <Card>
                <Card.Content className="space-y-2">
                  <div className="flex items-center gap-2 text-default-500">
                    <Ship size={14} />
                    <p className="text-xs uppercase">Current Vessels</p>
                  </div>
                  <p className="text-2xl font-bold">{totals.total}</p>
                </Card.Content>
              </Card>

              <Card>
                <Card.Content className="space-y-2">
                  <div className="flex items-center gap-2 text-default-500">
                    <Anchor size={14} />
                    <p className="text-xs uppercase">At Berth</p>
                  </div>
                  <p className="text-2xl font-bold">{totals.atBerth}</p>
                </Card.Content>
              </Card>

              <Card>
                <Card.Content className="space-y-2">
                  <div className="flex items-center gap-2 text-default-500">
                    <LocateFixed size={14} />
                    <p className="text-xs uppercase">Approaching</p>
                  </div>
                  <p className="text-2xl font-bold">{totals.approaching}</p>
                </Card.Content>
              </Card>

              <Card>
                <Card.Content className="space-y-2">
                  <div className="flex items-center gap-2 text-default-500">
                    <Waves size={14} />
                    <p className="text-xs uppercase">Underway</p>
                  </div>
                  <p className="text-2xl font-bold">{totals.underway}</p>
                </Card.Content>
              </Card>

              <Card>
                <Card.Content className="space-y-2">
                  <div className="flex items-center gap-2 text-default-500">
                    <Timer size={14} />
                    <p className="text-xs uppercase">Idle</p>
                  </div>
                  <p className="text-2xl font-bold">{totals.idle}</p>
                </Card.Content>
              </Card>
            </div>

            <Card>
              <Card.Content className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Role-Based Visibility</p>
                    <p className="text-xs text-default-500">{policy.description}</p>
                  </div>
                  <Chip color={policy.level === "full" ? "success" : "warning"} variant="soft">
                    {policy.level === "full" ? "Full View" : "Restricted View"}
                  </Chip>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="relative">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by vessel name, MMSI, or status"
                      className="pl-8"
                    />
                  </div>

                  <select
                    className="h-10 rounded-lg border border-divider bg-content1 px-3 text-sm text-foreground outline-none transition focus:border-primary"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as VesselStatus | "all")}
                  >
                    <option value="all">All Statuses</option>
                    <option value="at_berth">At Berth</option>
                    <option value="approaching">Approaching</option>
                    <option value="underway">Underway</option>
                    <option value="idle">Idle</option>
                    <option value="unknown">Unknown</option>
                  </select>

                  <div className="flex items-center justify-end text-sm text-default-500">
                    Showing {filteredVessels.length} of {vessels.length}
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger-700">
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="flex min-h-40 items-center justify-center">
                    <p className="text-sm text-default-500">Loading vessels...</p>
                  </div>
                ) : filteredVessels.length === 0 ? (
                  <div className="rounded-lg border border-divider bg-content2/40 p-4 text-sm text-default-500">
                    No vessels match the current filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-divider">
                    <table className="min-w-full divide-y divide-divider text-sm">
                      <thead className="bg-content2/50">
                        <tr>
                          <th className="px-3 py-3 text-left font-semibold">Vessel</th>
                          <th className="px-3 py-3 text-left font-semibold">MMSI</th>
                          <th className="px-3 py-3 text-left font-semibold">Status</th>
                          <th className="px-3 py-3 text-left font-semibold">Speed</th>
                          <th className="px-3 py-3 text-left font-semibold">Heading</th>
                          <th className="px-3 py-3 text-left font-semibold">Coordinates</th>
                          <th className="px-3 py-3 text-left font-semibold">Updated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-divider bg-content1">
                        {filteredVessels.map((vessel) => {
                          const normalized = normalizeStatus(vessel.status);
                          const status = statusMeta(normalized);

                          return (
                            <tr key={vessel.mmsi} className="hover:bg-content2/40">
                              <td className="px-3 py-3 font-medium">{vessel.name || "Unknown Vessel"}</td>
                              <td className="px-3 py-3 text-default-600">{vessel.mmsi}</td>
                              <td className="px-3 py-3">
                                <Chip size="sm" variant="soft" color={status.color}>
                                  {status.label}
                                </Chip>
                              </td>
                              <td className="px-3 py-3 text-default-600">
                                {policy.showMovement ? `${vessel.speed ?? 0} kn` : "Restricted"}
                              </td>
                              <td className="px-3 py-3 text-default-600">
                                {policy.showMovement
                                  ? vessel.heading != null
                                    ? `${vessel.heading}°`
                                    : "N/A"
                                  : "Restricted"}
                              </td>
                              <td className="px-3 py-3 text-default-600">
                                {policy.showCoordinates
                                  ? `${formatCoordinate(vessel.lat)}, ${formatCoordinate(vessel.lng)}`
                                  : "Restricted"}
                              </td>
                              <td className="px-3 py-3 text-default-600">{formatTimestamp(vessel.timestamp)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card.Content>
            </Card>

            <Card>
              <Card.Content className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-default-500">
                  Active role: <span className="font-medium text-foreground">{toTitleCase(sessionRole)}</span>
                </p>
                <p className="text-sm text-default-500">
                  Restricted fields are hidden based on role policy and can be expanded for operational roles.
                </p>
              </Card.Content>
            </Card>
          </>
        )}
      </section>
    </DashboardLayout>
  );
}
