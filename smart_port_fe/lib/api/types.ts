export interface HealthResponse {
  message?: string;
  status?: string;
}

export interface VesselDto {
  mmsi: string;
  name?: string;
  length?: number;
  draft?: number;
  status?: string;
  lat?: number;
  lng?: number;
  speed?: number;
  heading?: number;
  timestamp?: number;
}

export interface BerthAllocationView {
  berth: string;
  terminal: string;
  status: "occupied" | "assigned" | "available" | "maintenance";
  vessel: string;
  operation: string;
  etaOrEtd: string;
  loaLimit: string;
  draft: string;
  progress: number;
}

export interface BerthingSlotDto {
  id: string;
  type: string;
  is_occupied: boolean;
  depth: number;
  status?: string;
  reserved_by?: string;
}

export interface BerthingSlotsOverviewResponse {
  slots: BerthingSlotDto[];
}

export interface BerthingVesselPayload {
  id: string;
  name: string;
  length: number;
  draft: number;
  arrival_planned: string;
  stay_duration: number;
  allocated_by?: string;
}

export interface BerthingAllocationResponse {
  message: string;
  vessel: string;
  assigned_slots: string[];
}

export interface BerthingAllocationHistoryEntry {
  vessel_id: string;
  vessel_name: string;
  allocated_by: string;
  allocated_at: string;
  slot_ids: string[];
}

export interface BerthingAllocationHistoryResponse {
  history: BerthingAllocationHistoryEntry[];
}

export type UserRole = "shipping_agent" | "berth_planner" | "finance_officer" | "operations_staff" | "admin";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface UserCreateRequest {
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  password?: string;
}

export interface LogisticsVesselVisitDto {
  id: string;
  vesselId: string;
  vesselName: string;
  length: number;
  depth: number;
  manifestFileUrl?: string;
  status: string;
  arrivalRequestedAt: string;
}

export type InvoiceStatus = "PENDING" | "PAID" | "CANCELLED" | "OVERDUE";
export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "REFUNDED";

export interface InvoiceLineItemDto {
  id: string;
  description: string;
  amount: number;
  category: string;
  quantity?: number;
  invoiceId: string;
}

export interface InvoiceDto {
  id: string;
  vesselId: string;
  vesselName: string;
  allocatedBy: string;
  slotIds: string[];
  slotCount: number;
  arrivalPlanned: string;
  stayDurationHours: number;
  actualDurationHours?: number;
  dockedAt?: string;
  departedAt?: string;
  baseBerthFee: number;
  portFee: number;
  penaltyAmount: number;
  overstayHours: number;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  paidAt?: string;
  dueDate: string;
  notes?: string;
  lineItems?: InvoiceLineItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceListResponse {
  invoices: InvoiceDto[];
  count: number;
}

export type NotificationSeverity = "critical" | "warning" | "info";

export interface NotificationRecord {
  id: string;
  title: string;
  detail: string;
  severity: NotificationSeverity;
  time: string;
  sourceEvent: string;
  read: boolean;
}

export interface NotificationListResponse {
  notifications: NotificationRecord[];
  total: number;
  unread: number;
}
