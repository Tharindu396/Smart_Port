import { resolveApiBaseUrl } from "@/lib/api/config";
import { requestJson, ApiError } from "@/lib/api/http";
import type { LogisticsVesselVisitDto } from "@/lib/api/types";

const baseUrl = resolveApiBaseUrl("logisticsServiceBaseUrl");

export const logisticsApi = {
  getVesselVisits(): Promise<LogisticsVesselVisitDto[]> {
    return requestJson<LogisticsVesselVisitDto[]>(`${baseUrl}/vessel`);
  },

  // Request a berth visit in logistics-service (multipart endpoint)
  async requestBerth(payload: {
    vesselId: string;
    vesselName: string;
    length: number;
    requestedByAgentId: string | number;
    depth: number;
  }): Promise<any> {
    const url = `${baseUrl}/vessel/request-berth`;

    const form = new FormData();
    form.append("vesselId", String(payload.vesselId));
    form.append("vesselName", String(payload.vesselName));
    form.append("length", String(payload.length));
    form.append("requestedByAgentId", String(payload.requestedByAgentId));
    form.append("depth", String(payload.depth));

    const res = await fetch(url, { method: "POST", body: form, cache: "no-store" });
    const ct = res.headers.get("content-type") ?? "";
    const body = ct.includes("application/json") ? await res.json() : await res.text();
    if (!res.ok) {
      const msg = (typeof body === "object" && body && "message" in body && String((body as any).message)) || res.statusText || "Request failed";
      throw new ApiError(msg, res.status, body);
    }

    return body;
  },
};
