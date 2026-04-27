import { resolveApiBaseUrl } from "@/lib/api/config";
import { requestJson } from "@/lib/api/http";
import type { LogisticsVesselVisitDto } from "@/lib/api/types";

const baseUrl = resolveApiBaseUrl("logisticsServiceBaseUrl");

export const logisticsApi = {
  getVesselVisits(): Promise<LogisticsVesselVisitDto[]> {
    return requestJson<LogisticsVesselVisitDto[]>(`${baseUrl}/vessel`);
  },
};
