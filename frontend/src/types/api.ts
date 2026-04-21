export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AvailabilityResponse {
  field: 'email' | 'username'
  value: string
  available: boolean
}

export interface UserPublic {
  id: number
  email: string
  username: string
  bio: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
}

export interface PostRead {
  id: number
  author_id: number
  content: string
  is_edited: boolean
  created_at: string
  updated_at: string
}

export interface UserUpdateMe {
  username?: string
  bio?: string
  avatar_url?: string
}

export interface PostCreateRequest {
  content: string
}

export interface PostUpdateRequest {
  content: string
}

export type ReactionType = 'like' | 'heart' | 'fire' | 'laugh'

export interface ReactionRead {
  post_id: number
  reaction_type: ReactionType
}
