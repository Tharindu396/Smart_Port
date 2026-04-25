import type { BerthAllocationView, VesselDto } from "@/lib/api/types";

const berthIds = ["B-01", "B-02", "B-03", "B-04", "B-05", "B-06", "B-07", "B-08", "B-09", "B-10", "B-11", "B-12"];
const terminals = ["Container North", "Bulk East", "Energy South", "General Cargo"];

function estimateStatus(vessel: VesselDto): BerthAllocationView["status"] {
  const speed = vessel.speed ?? 0;
  if (speed < 0.2) return "occupied";
  if (speed < 3) return "assigned";
  return "available";
}

function estimateProgress(vessel: VesselDto): number {
  const speed = vessel.speed ?? 0;
  if (speed < 0.2) return 70;
  if (speed < 3) return 40;
  return 0;
}

export function mapVesselsToBerthAllocations(vessels: VesselDto[]): BerthAllocationView[] {
  return berthIds.slice(0, 6).map((berth, index) => {
    const vessel = vessels[index];

    if (!vessel) {
      return {
        berth,
        terminal: terminals[index % terminals.length],
        status: "available",
        vessel: "Awaiting assignment",
        operation: "Ready for incoming vessel",
        etaOrEtd: "Open slot",
        loaLimit: `${280 + index * 8}m`,
        draft: `${(12 + index * 0.4).toFixed(1)}m`,
        progress: 0,
      };
    }

    const status = estimateStatus(vessel);
    const speed = vessel.speed ?? 0;

    return {
      berth,
      terminal: terminals[index % terminals.length],
      status,
      vessel: vessel.name || `MMSI ${vessel.mmsi}`,
      operation:
        status === "occupied"
          ? "Cargo handling in progress"
          : status === "assigned"
          ? "Approaching pilot zone"
          : "Awaiting assignment",
      etaOrEtd: status === "occupied" ? "ETD Pending" : "ETA Pending",
      loaLimit: `${280 + index * 8}m`,
      draft: `${(vessel.draft ?? 12).toFixed(1)}m`,
      progress: estimateProgress(vessel) + Math.min(Math.round(speed), 20),
    };
  });
}
