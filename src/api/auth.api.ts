import { apiClient } from './axios';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, RefreshTokenRequest } from '../types';

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return res.data.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return res.data.data;
  },

  refresh: async (data: RefreshTokenRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh', data);
    return res.data.data;
  },

  logout: async (refreshToken?: string): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/logout', refreshToken ? { refreshToken } : {});
  },

  forgotPassword: async (data: ForgotPasswordData): Promise<string> => {
    const res = await apiClient.post<ApiResponse<string>>('/auth/forgot-password', data);
    return res.data.message;
  },

  resetPassword: async (data: ResetPasswordData): Promise<string> => {
    const res = await apiClient.post<ApiResponse<string>>('/auth/reset-password', data);
    return res.data.message;
  },
};
