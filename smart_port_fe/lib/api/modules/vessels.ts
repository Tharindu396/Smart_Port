import { resolveApiBaseUrl } from "@/lib/api/config";
import { requestJson } from "@/lib/api/http";
import type { VesselDto } from "@/lib/api/types";

const baseUrl = resolveApiBaseUrl("vesselTrackingBaseUrl");

export const vesselsApi = {
  getAll(): Promise<VesselDto[]> {
    return requestJson<VesselDto[]>(`${baseUrl}/vessels`);
  },

  getByMmsi(mmsi: string): Promise<VesselDto> {
    return requestJson<VesselDto>(`${baseUrl}/vessels/${mmsi}`);
  },

  getAisFeed(): Promise<VesselDto[]> {
    return requestJson<VesselDto[]>(`${baseUrl}/vessels/ais`);
  },
};
