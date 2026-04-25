import { resolveApiBaseUrl } from "@/lib/api/config";
import { requestJson } from "@/lib/api/http";
import { getAccessToken } from "@/lib/auth/session";
import type { UserRole, UserRecord, UserCreateRequest, UserUpdateRequest } from "@/lib/api/types";

const baseUrl = resolveApiBaseUrl("nestServicesBaseUrl");

function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const usersApi = {
  getAll(): Promise<UserRecord[]> {
    return requestJson<UserRecord[]>(`${baseUrl}/users`, {
      method: "GET",
      headers: authHeaders(),
    });
  },

  create(payload: UserCreateRequest): Promise<UserRecord> {
    return requestJson<UserRecord>(`${baseUrl}/users/create`, {
      method: "POST",
      headers: authHeaders(),
      body: payload,
    });
  },

  update(id: number, payload: UserUpdateRequest): Promise<UserRecord> {
    return requestJson<UserRecord>(`${baseUrl}/users/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: payload,
    });
  },
};

export const allAssignableRoles: UserRole[] = [
  "shipping_agent",
  "berth_planner",
  "finance_officer",
  "operations_staff",
  "admin",
];
