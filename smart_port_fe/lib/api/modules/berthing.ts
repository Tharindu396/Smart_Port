import { resolveApiBaseUrl } from "@/lib/api/config";
import { requestJson } from "@/lib/api/http";
import type {
  BerthingAllocationResponse,
  BerthingAllocationHistoryResponse,
  BerthingSlotsOverviewResponse,
  BerthingVesselPayload,
} from "@/lib/api/types";

const baseUrl = resolveApiBaseUrl("berthingServiceBaseUrl");

export const berthingApi = {
  getSlotsOverview(): Promise<BerthingSlotsOverviewResponse> {
    return requestJson<BerthingSlotsOverviewResponse>(`${baseUrl}/berths/slots`);
  },

  allocateBerth(payload: BerthingVesselPayload): Promise<BerthingAllocationResponse> {
    return requestJson<BerthingAllocationResponse>(`${baseUrl}/allocate-berth`, {
      method: "POST",
      body: payload,
    });
  },

  getAllocationHistory(limit = 20): Promise<BerthingAllocationHistoryResponse> {
    return requestJson<BerthingAllocationHistoryResponse>(`${baseUrl}/allocations/history?limit=${limit}`);
  },

  confirmPayment(vesselId: string): Promise<{ message: string }> {
    return requestJson<{ message: string }>(`${baseUrl}/payments/confirm`, {
      method: "POST",
      body: { vessel_id: vesselId },
    });
  },

  cancelAllocation(vesselId: string): Promise<{ message: string }> {
    return requestJson<{ message: string }>(`${baseUrl}/payments/cancel`, {
      method: "POST",
      body: { vessel_id: vesselId },
    });
  },
};
