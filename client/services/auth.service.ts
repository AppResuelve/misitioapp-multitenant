// services/auth.service.ts
import api from "@/services/admin-api";

export interface RequestResetCodePayload {
  email: string;
}

export interface ResetPasswordWithCodePayload {
  email: string;
  code: string;
  password: string;
}

export interface ResetPasswordWithTokenPayload {
  token: string;
  password: string;
}

export interface AuthActionResponse {
  success: boolean;
  message?: string;
}

export const authService = {
  requestResetCode: async (
    payload: RequestResetCodePayload,
  ): Promise<AuthActionResponse> => {
    const { data } = await api.post("/auth/forgot-password", payload);
    return data;
  },

  resetPasswordWithCode: async (
    payload: ResetPasswordWithCodePayload,
  ): Promise<AuthActionResponse> => {
    const { data } = await api.post("/auth/reset-password", payload);
    return data;
  },

  resetPasswordWithToken: async (
    payload: ResetPasswordWithTokenPayload,
  ): Promise<AuthActionResponse> => {
    const { data } = await api.post("/auth/reset-password", payload);
    return data;
  },
};
