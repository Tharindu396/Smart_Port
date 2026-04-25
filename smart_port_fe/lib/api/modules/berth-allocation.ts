import { mapVesselsToBerthAllocations } from "@/lib/api/mappers/berth.mapper";
import { vesselsApi } from "@/lib/api/modules/vessels";
import type { BerthAllocationView } from "@/lib/api/types";

export const berthAllocationApi = {
  async getOverview(): Promise<BerthAllocationView[]> {
    const vessels = await vesselsApi.getAll();
    return mapVesselsToBerthAllocations(vessels);
  },
};
