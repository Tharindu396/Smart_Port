import { resolveApiBaseUrl } from "@/lib/api/config";
import { requestJson } from "@/lib/api/http";
import type { HealthResponse } from "@/lib/api/types";

const vesselBaseUrl = resolveApiBaseUrl("vesselTrackingBaseUrl");

export const healthApi = {
  vesselService(): Promise<HealthResponse> {
    return requestJson<HealthResponse>(`${vesselBaseUrl}/health`);
  },
};
