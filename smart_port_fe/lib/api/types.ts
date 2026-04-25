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
