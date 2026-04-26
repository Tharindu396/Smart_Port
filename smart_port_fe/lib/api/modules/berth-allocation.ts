import type {
  BerthAllocationView,
  BerthingAllocationResponse,
  BerthingAllocationHistoryEntry,
  BerthingSlotDto,
  BerthingVesselPayload,
  VesselDto,
} from "@/lib/api/types";
import { berthingApi } from "@/lib/api/modules/berthing";
import { vesselsApi } from "@/lib/api/modules/vessels";

function normalizeSlotStatus(slot: BerthingSlotDto): BerthAllocationView["status"] {
  const status = (slot.status ?? "").toUpperCase();
  if (status === "OCCUPIED") return "occupied";
  if (status === "PENDING_PAYMENT") return "assigned";
  return slot.is_occupied ? "occupied" : "available";
}

function mapSlotToView(slot: BerthingSlotDto): BerthAllocationView {
  const status = normalizeSlotStatus(slot);

  return {
    berth: slot.id,
    terminal: slot.type === "BERTH" ? "Marine Berth" : "Yard",
    status,
    vessel: slot.reserved_by || (status === "available" ? "Awaiting assignment" : "Unknown vessel"),
    operation:
      status === "occupied"
        ? "In operation"
        : status === "assigned"
        ? "Reserved pending payment"
        : "Ready for incoming vessel",
    etaOrEtd: status === "available" ? "Open slot" : "ETA pending",
    loaLimit: "Dynamic",
    draft: `${slot.depth.toFixed(1)}m`,
    progress: status === "occupied" ? 70 : status === "assigned" ? 35 : 0,
  };
}

function mapVesselToBerthingPayload(vessel: VesselDto, allocatedBy?: string): BerthingVesselPayload {
  const vesselLengthMeters = vessel.length ?? 180;
  // Berthing service currently expects slot-count style length, not LOA meters.
  const slotUnits = Math.min(5, Math.max(1, Math.ceil(vesselLengthMeters / 80)));
  const arrival = vessel.timestamp ? new Date(vessel.timestamp * 1000) : new Date();

  return {
    id: vessel.mmsi,
    name: vessel.name || `MMSI ${vessel.mmsi}`,
    length: slotUnits,
    draft: vessel.draft ?? 10,
    arrival_planned: arrival.toISOString(),
    stay_duration: 6,
    allocated_by: allocatedBy,
  };
}

export const berthAllocationApi = {
  async getOverview(): Promise<BerthAllocationView[]> {
    const response = await berthingApi.getSlotsOverview();
    return response.slots.map(mapSlotToView);
  },

  async runAutoAllocation(maxVessels = 4, allocatedBy?: string): Promise<{
    attempted: number;
    allocated: number;
    failures: number;
    results: BerthingAllocationResponse[];
  }> {
    const vessels = await vesselsApi.getAll();
    const candidates = vessels.slice(0, maxVessels).map((vessel) => mapVesselToBerthingPayload(vessel, allocatedBy));
    const settled = await Promise.allSettled(candidates.map((payload) => berthingApi.allocateBerth(payload)));

    const results: BerthingAllocationResponse[] = [];
    let failures = 0;

    for (const item of settled) {
      if (item.status === "fulfilled") {
        results.push(item.value);
      } else {
        failures += 1;
      }
    }

    return {
      attempted: candidates.length,
      allocated: results.length,
      failures,
      results,
    };
  },

  async getAllocationHistory(limit = 20): Promise<BerthingAllocationHistoryEntry[]> {
    const response = await berthingApi.getAllocationHistory(limit);
    return response.history;
  },
};
