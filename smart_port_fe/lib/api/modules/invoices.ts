import { resolveApiBaseUrl } from "@/lib/api/config";
import { requestJson } from "@/lib/api/http";
import type { InvoiceListResponse, InvoiceStatus } from "@/lib/api/types";

const baseUrl = resolveApiBaseUrl("invoiceServiceBaseUrl");

export const invoicesApi = {
  getAll(status?: InvoiceStatus): Promise<InvoiceListResponse> {
    const url = status ? `${baseUrl}/invoices?status=${status}` : `${baseUrl}/invoices`;
    return requestJson<InvoiceListResponse>(url);
  },

  getByVessel(vesselId: string): Promise<InvoiceListResponse> {
    return requestJson<InvoiceListResponse>(`${baseUrl}/invoices/vessel/${vesselId}`);
  },
};
