import { resolveApiBaseUrl } from "@/lib/api/config";
import { requestJson } from "@/lib/api/http";
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from "@/lib/api/types";

const baseUrl = resolveApiBaseUrl("nestServicesBaseUrl");

export const authApi = {
  login(payload: LoginRequest): Promise<LoginResponse> {
    return requestJson<LoginResponse>(`${baseUrl}/auth/login`, {
      method: "POST",
      body: payload,
    });
  },

  register(payload: RegisterRequest): Promise<RegisterResponse> {
    return requestJson<RegisterResponse>(`${baseUrl}/users`, {
      method: "POST",
      body: payload,
    });
  },
};
