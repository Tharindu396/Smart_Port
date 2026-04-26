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
