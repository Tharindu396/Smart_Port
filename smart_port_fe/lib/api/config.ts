export const apiConfig = {
  vesselTrackingBaseUrl:
    process.env.NEXT_PUBLIC_VESSEL_TRACKING_API_URL ?? "http://localhost:8080/api",
  nestServicesBaseUrl:
    process.env.NEXT_PUBLIC_NEST_API_URL ?? "http://localhost:3001",
};

export type ApiServiceKey = keyof typeof apiConfig;

export function resolveApiBaseUrl(service: ApiServiceKey): string {
  return apiConfig[service].replace(/\/$/, "");
}
