"use client";

import { DashboardLayout } from "@/app/components/DashboardLayout";
import { ApiError, logisticsApi, type LogisticsVesselVisitDto } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { Button, Card, Chip, Input, ProgressBar as Progress } from "@heroui/react";
import { Box, ClipboardList, PackageSearch, RefreshCw, Search, TimerReset, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CargoStatus = "inbound" | "in_customs" | "loaded" | "delivered" | "exception";

type CargoItem = {
  id: string;
  cargoCode: string;
  vesselName: string;
  vesselId: string;
  cargoType: string;
  status: CargoStatus;
  location: string;
  eta: string;
  progress: number;
  manifestRef: string;
};

const fallbackCargo: CargoItem[] = [
  {
    id: "demo-001",
    cargoCode: "CG-7821-A1F4",
    vesselName: "MV Horizon Atlas",
    vesselId: "7821345",
    cargoType: "Reefer Containers",
    status: "inbound",
    location: "Approach Lane C",
    eta: "Today 16:20",
    progress: 42,
    manifestRef: "manifest-horizon.pdf",
  },
  {
    id: "demo-002",
    cargoCode: "CG-1456-B9D8",
    vesselName: "SS Coral Dawn",
    vesselId: "1456788",
    cargoType: "Steel Coils",
    status: "in_customs",
    location: "Customs Bay 2",
    eta: "Today 14:40",
    progress: 67,
    manifestRef: "manifest-coral.xlsx",
  },
  {
    id: "demo-003",
    cargoCode: "CG-6543-C2H7",
    vesselName: "MT Pacific Drift",
    vesselId: "6543219",
    cargoType: "Bulk Grain",
    status: "loaded",
    location: "Berth B-06",
    eta: "Tomorrow 08:10",
    progress: 88,
    manifestRef: "manifest-pacific.csv",
  },
  {
    id: "demo-004",
    cargoCode: "CG-2314-D4K2",
    vesselName: "Ocean Meridian",
    vesselId: "2314900",
    cargoType: "Project Cargo",
    status: "exception",
    location: "Inspection Hold",
    eta: "Pending Recheck",
    progress: 23,
    manifestRef: "manifest-meridian.pdf",
  },
];

function toCargoStatus(status: string): CargoStatus {
  const normalized = status.toUpperCase();
  if (normalized.includes("PENDING")) return "inbound";
  if (normalized.includes("ALLOCATED")) return "loaded";
  if (normalized.includes("REJECTED") || normalized.includes("CANCELLED")) return "exception";
  return "in_customs";
}

function toCargoType(length: number): string {
  if (length >= 280) return "Container Stacks";
  if (length >= 220) return "Bulk Dry Cargo";
  if (length >= 170) return "Mixed General Cargo";
  return "Light Mixed Cargo";
}

function toProgress(status: CargoStatus): number {
  if (status === "inbound") return 35;
  if (status === "in_customs") return 60;
  if (status === "loaded") return 90;
  if (status === "delivered") return 100;
  return 20;
}

function statusMeta(status: CargoStatus): { label: string; color: "accent" | "warning" | "success" | "danger" | "default" } {
  if (status === "inbound") return { label: "Inbound", color: "accent" };
  if (status === "in_customs") return { label: "In Customs", color: "warning" };
  if (status === "loaded") return { label: "Loaded", color: "success" };
  if (status === "delivered") return { label: "Delivered", color: "success" };
  if (status === "exception") return { label: "Exception", color: "danger" };
  return { label: "Unknown", color: "default" };
}

function formatEta(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "ETA unavailable";
  }
  return date.toLocaleString();
}

function mapVisitsToCargo(visits: LogisticsVesselVisitDto[]): CargoItem[] {
  return visits.map((visit) => {
    const mappedStatus = toCargoStatus(visit.status);
    const shortId = visit.id.replace(/-/g, "").slice(0, 4).toUpperCase();
    const vesselTail = visit.vesselId.slice(-4).padStart(4, "0");

    return {
      id: visit.id,
      cargoCode: `CG-${vesselTail}-${shortId}`,
      vesselName: visit.vesselName,
      vesselId: visit.vesselId,
      cargoType: toCargoType(visit.length),
      status: mappedStatus,
      location: mappedStatus === "loaded" ? "Assigned Berth" : mappedStatus === "exception" ? "Manual Review" : "Inbound Yard",
      eta: formatEta(visit.arrivalRequestedAt),
      progress: toProgress(mappedStatus),
      manifestRef: visit.manifestFileUrl?.split(/[\\/]/).pop() || "manifest not uploaded",
    };
  });
}

export default function LogisticsPage() {
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CargoStatus | "all">("all");
  const [error, setError] = useState<string | null>(null);

  const user = useMemo(() => getSessionUser(), []);

  const loadCargo = async () => {
    setLoading(true);
    setError(null);

    try {
      const visits = await logisticsApi.getVesselVisits();
      if (visits.length === 0) {
        setCargoItems(fallbackCargo);
      } else {
        setCargoItems(mapVisitsToCargo(visits));
      }
    } catch (err) {
      setCargoItems(fallbackCargo);
      if (err instanceof ApiError || err instanceof Error) {
        setError("Live logistics feed is unavailable. Showing demo cargo tracking data.");
      } else {
        setError("Unable to load live logistics data. Showing demo cargo tracking data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCargo();
  }, []);

  const filteredItems = useMemo(() => {
    return cargoItems.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;

      const needle = search.trim().toLowerCase();
      if (!needle) return true;

      return [item.cargoCode, item.vesselName, item.vesselId, item.cargoType, item.location]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [cargoItems, search, statusFilter]);

  const metrics = useMemo(() => {
    const total = cargoItems.length;
    const inbound = cargoItems.filter((item) => item.status === "inbound").length;
    const customs = cargoItems.filter((item) => item.status === "in_customs").length;
    const loaded = cargoItems.filter((item) => item.status === "loaded").length;
    const exceptions = cargoItems.filter((item) => item.status === "exception").length;

    return { total, inbound, customs, loaded, exceptions };
  }, [cargoItems]);

  return (
    <DashboardLayout defaultActiveKey="logistics" pageTitle="Logistics">
      <section className="space-y-6">
        <header className="rounded-2xl border border-divider bg-linear-to-r from-content2 via-content1 to-secondary/10 p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/15 px-3 py-1 text-xs font-medium text-secondary">
                <PackageSearch size={14} />
                Cargo Control Tower
              </div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Cargo Tracking Workspace</h2>
              <p className="max-w-2xl text-sm text-default-500 md:text-base">
                Track cargo flow from manifest intake to berth handling using live logistics-service records.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Chip variant="soft" color="accent">
                {user ? `${user.role.replace("_", " ")} view` : "guest view"}
              </Chip>
              <Button variant="secondary" onPress={loadCargo} isPending={loading}>
                <RefreshCw size={16} />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        {error && (
          <Card>
            <Card.Content className="text-sm text-warning-700">{error}</Card.Content>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card>
            <Card.Content className="space-y-2">
              <div className="flex items-center gap-2 text-default-500">
                <ClipboardList size={14} />
                <p className="text-xs uppercase">Tracked Items</p>
              </div>
              <p className="text-2xl font-bold">{metrics.total}</p>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="space-y-2">
              <div className="flex items-center gap-2 text-default-500">
                <Truck size={14} />
                <p className="text-xs uppercase">Inbound</p>
              </div>
              <p className="text-2xl font-bold">{metrics.inbound}</p>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="space-y-2">
              <div className="flex items-center gap-2 text-default-500">
                <Box size={14} />
                <p className="text-xs uppercase">In Customs</p>
              </div>
              <p className="text-2xl font-bold">{metrics.customs}</p>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="space-y-2">
              <div className="flex items-center gap-2 text-default-500">
                <TimerReset size={14} />
                <p className="text-xs uppercase">Loaded</p>
              </div>
              <p className="text-2xl font-bold">{metrics.loaded}</p>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="space-y-2">
              <div className="flex items-center gap-2 text-default-500">
                <PackageSearch size={14} />
                <p className="text-xs uppercase">Exceptions</p>
              </div>
              <p className="text-2xl font-bold">{metrics.exceptions}</p>
            </Card.Content>
          </Card>
        </div>

        <Card>
          <Card.Content className="space-y-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="relative lg:col-span-2">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by cargo code, vessel, type, or location"
                  className="pl-8"
                />
              </div>

              <select
                className="h-10 rounded-lg border border-divider bg-content1 px-3 text-sm text-foreground outline-none transition focus:border-primary"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as CargoStatus | "all")}
              >
                <option value="all">All statuses</option>
                <option value="inbound">Inbound</option>
                <option value="in_customs">In Customs</option>
                <option value="loaded">Loaded</option>
                <option value="delivered">Delivered</option>
                <option value="exception">Exception</option>
              </select>
            </div>

            {loading ? (
              <div className="rounded-lg border border-divider p-4 text-sm text-default-500">Loading cargo tracking records...</div>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-lg border border-divider p-4 text-sm text-default-500">No cargo items matched your filters.</div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const meta = statusMeta(item.status);
                  return (
                    <article key={item.id} className="rounded-xl border border-divider bg-content2/40 p-4 transition-colors hover:bg-content2">
                      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-base font-semibold">{item.cargoCode}</p>
                            <Chip size="sm" variant="soft" color="default">
                              {item.cargoType}
                            </Chip>
                          </div>
                          <p className="text-sm text-default-600">{item.vesselName} • Vessel ID: {item.vesselId}</p>
                        </div>

                        <Chip size="sm" color={meta.color}>
                          {meta.label}
                        </Chip>
                      </div>

                      <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
                        <div>
                          <p className="text-xs text-default-500">Current Location</p>
                          <p className="font-medium">{item.location}</p>
                        </div>
                        <div>
                          <p className="text-xs text-default-500">ETA</p>
                          <p className="font-medium">{item.eta}</p>
                        </div>
                        <div>
                          <p className="text-xs text-default-500">Manifest</p>
                          <p className="font-medium">{item.manifestRef}</p>
                        </div>
                        <div>
                          <p className="text-xs text-default-500">Progress</p>
                          <div className="mt-1 flex items-center gap-3">
                            <Progress value={item.progress} className="h-2" color={meta.color === "danger" ? "warning" : "accent"} />
                            <span className="text-xs font-medium">{item.progress}%</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </Card.Content>
        </Card>
      </section>
    </DashboardLayout>
  );
}
