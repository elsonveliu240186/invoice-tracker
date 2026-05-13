import { http } from '@/shared/lib/http';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  email: string;
  displayName: string;
}

export interface RegisterRequest {
  displayName: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  email: string;
  displayName: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export async function loginRequest(data: LoginRequest): Promise<LoginResponse> {
  return http<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function registerRequest(data: RegisterRequest): Promise<RegisterResponse> {
  return http<RegisterResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function forgotPasswordRequest(data: ForgotPasswordRequest): Promise<void> {
  return http<void>('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
