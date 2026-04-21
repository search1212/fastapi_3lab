import { apiRequest } from './client'
import type { UserPublic, UserUpdateMe } from '../types/api'

export async function getMe(token: string): Promise<UserPublic> {
  return apiRequest<UserPublic>('/users/me', { method: 'GET', token })
}

export async function updateMe(token: string, payload: UserUpdateMe): Promise<UserPublic> {
  return apiRequest<UserPublic>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  })
}

export async function searchUsers(query: string, token: string): Promise<UserPublic[]> {
  const q = new URLSearchParams({ q: query }).toString()
  return apiRequest<UserPublic[]>(`/users/search?${q}`, { method: 'GET', token })
}

export async function getUserById(userId: string, token: string): Promise<UserPublic> {
  return apiRequest<UserPublic>(`/users/${userId}`, { method: 'GET', token })
}

export async function followUser(userId: string, token: string): Promise<void> {
  return apiRequest<void>(`/users/${userId}/follow`, { method: 'POST', token })
}

export async function unfollowUser(userId: string, token: string): Promise<void> {
  return apiRequest<void>(`/users/${userId}/follow`, { method: 'DELETE', token })
}

export async function getFollowers(userId: string, token: string): Promise<UserPublic[]> {
  return apiRequest<UserPublic[]>(`/users/${userId}/followers`, { method: 'GET', token })
}

export async function getFollowing(userId: string, token: string): Promise<UserPublic[]> {
  return apiRequest<UserPublic[]>(`/users/${userId}/following`, { method: 'GET', token })
}
