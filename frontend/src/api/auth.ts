import { apiRequest } from './client'
import type { AuthResponse, LoginRequest, RegisterRequest, UserPublic } from '../types/api'

export async function registerUser(payload: RegisterRequest): Promise<UserPublic> {
  return apiRequest<UserPublic>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function loginUser(payload: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
