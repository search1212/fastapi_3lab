import { apiRequest } from './client'
import type { AuthResponse, AvailabilityResponse, LoginRequest, RegisterRequest, UserPublic } from '../types/api'

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

export async function checkEmailAvailability(email: string): Promise<AvailabilityResponse> {
  const query = new URLSearchParams({ email }).toString()
  return apiRequest<AvailabilityResponse>(`/auth/check-email?${query}`, { method: 'GET' })
}

export async function checkUsernameAvailability(username: string): Promise<AvailabilityResponse> {
  const query = new URLSearchParams({ username }).toString()
  return apiRequest<AvailabilityResponse>(`/auth/check-username?${query}`, { method: 'GET' })
}
