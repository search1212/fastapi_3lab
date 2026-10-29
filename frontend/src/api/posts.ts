import { apiRequest } from './client'
import type {
  PostCreateRequest,
  PostRead,
  PostUpdateRequest,
  ReactionCountRead,
  ReactionRead,
  ReactionType,
} from '../types/api'

export async function getGlobalFeed(): Promise<PostRead[]> {
  return apiRequest<PostRead[]>('/posts/feed/global', { method: 'GET' })
}

export async function getFollowingFeed(token: string): Promise<PostRead[]> {
  return apiRequest<PostRead[]>('/posts/feed/following', { method: 'GET', token })
}

export async function getMyPosts(token: string): Promise<PostRead[]> {
  return apiRequest<PostRead[]>('/posts/me', { method: 'GET', token })
}

export async function createPost(payload: PostCreateRequest, token: string): Promise<PostRead> {
  return apiRequest<PostRead>('/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

export async function updatePost(postId: number, payload: PostUpdateRequest, token: string): Promise<PostRead> {
  return apiRequest<PostRead>(`/posts/${postId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  })
}

export async function setReaction(postId: number, reactionType: ReactionType, token: string): Promise<void> {
  return apiRequest<void>(`/posts/${postId}/reaction`, {
    method: 'PUT',
    body: JSON.stringify({ reaction_type: reactionType }),
    token,
  })
}

export async function removeReaction(postId: number, token: string): Promise<void> {
  return apiRequest<void>(`/posts/${postId}/reaction`, {
    method: 'DELETE',
    token,
  })
}

export async function getMyReactions(token: string): Promise<ReactionRead[]> {
  return apiRequest<ReactionRead[]>('/posts/reactions/me', {
    method: 'GET',
    token,
  })
}

export async function getReactionCounts(postIds: number[]): Promise<ReactionCountRead[]> {
  if (postIds.length === 0) return []
  const query = postIds.map((id) => `post_ids=${id}`).join('&')
  return apiRequest<ReactionCountRead[]>(`/posts/reactions/counts?${query}`, {
    method: 'GET',
  })
}
