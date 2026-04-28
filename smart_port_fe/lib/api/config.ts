export const apiConfig = {
  vesselTrackingBaseUrl:
    process.env.NEXT_PUBLIC_VESSEL_TRACKING_API_URL ?? "http://localhost:8001/api",
  berthingServiceBaseUrl:
    process.env.NEXT_PUBLIC_BERTHING_API_URL ?? "http://localhost:8002/api/v1",
  logisticsServiceBaseUrl:
    process.env.NEXT_PUBLIC_LOGISTICS_API_URL ?? "http://localhost:3002",
  invoiceServiceBaseUrl:
    process.env.NEXT_PUBLIC_INVOICE_API_URL ?? "http://localhost:3001/api/v1",
  nestServicesBaseUrl:
    process.env.NEXT_PUBLIC_NEST_API_URL ?? "http://localhost:3003",
  notificationServiceBaseUrl:
    process.env.NEXT_PUBLIC_NOTIFICATION_API_URL ?? "http://localhost:3004",
};

export type ApiServiceKey = keyof typeof apiConfig;

export function resolveApiBaseUrl(service: ApiServiceKey): string {
  return apiConfig[service].replace(/\/$/, "");
}
