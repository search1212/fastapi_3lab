import { apiRequest } from './client'
import type { PostRead } from '../types/api'

export async function getGlobalFeed(): Promise<PostRead[]> {
  return apiRequest<PostRead[]>('/posts/feed/global', { method: 'GET' })
}
