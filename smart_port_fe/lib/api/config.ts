export const apiConfig = {
  vesselTrackingBaseUrl:
    process.env.NEXT_PUBLIC_VESSEL_TRACKING_API_URL ?? "http://localhost:8080/api",
  berthingServiceBaseUrl:
    process.env.NEXT_PUBLIC_BERTHING_API_URL ?? "http://localhost:5003/api/v1",
  logisticsServiceBaseUrl:
    process.env.NEXT_PUBLIC_LOGISTICS_API_URL ?? "http://localhost:3002",
  invoiceServiceBaseUrl:
    process.env.NEXT_PUBLIC_INVOICE_API_URL ?? "http://localhost:5004/api/v1",
  nestServicesBaseUrl:
    process.env.NEXT_PUBLIC_NEST_API_URL ?? "http://localhost:8000",
  notificationServiceBaseUrl:
    process.env.NEXT_PUBLIC_NOTIFICATION_API_URL ?? "http://localhost:3004",
};

export type ApiServiceKey = keyof typeof apiConfig;

export function resolveApiBaseUrl(service: ApiServiceKey): string {
  return apiConfig[service].replace(/\/$/, "");
}
