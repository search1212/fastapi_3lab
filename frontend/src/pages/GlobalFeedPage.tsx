import { useEffect, useState } from 'react'
import { getGlobalFeed } from '../api/posts'
import { ApiError } from '../api/client'
import { removeReaction, setReaction } from '../api/posts'
import { useAuth } from '../auth/AuthContext'
import { PostCard } from '../components/PostCard'
import type { PostRead, ReactionType } from '../types/api'

export function GlobalFeedPage() {
  const { accessToken } = useAuth()
  const [posts, setPosts] = useState<PostRead[]>([])
  const [reactions, setReactions] = useState<Record<string, ReactionType | null>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getGlobalFeed()
        setPosts(data)
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError('Ошибка загрузки ленты')
        }
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [])

  const onReact = async (postId: string, reaction: ReactionType) => {
    if (!accessToken) return
    try {
      await setReaction(postId, reaction, accessToken)
      setReactions((prev) => ({ ...prev, [postId]: reaction }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось поставить реакцию')
    }
  }

  const onRemoveReaction = async (postId: string) => {
    if (!accessToken) return
    try {
      await removeReaction(postId, accessToken)
      setReactions((prev) => ({ ...prev, [postId]: null }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось убрать реакцию')
    }
  }

  return (
    <section>
      <h2>Общая лента</h2>
      {isLoading && <p className="muted">Загружаем посты...</p>}
      {error && <p className="error">{error}</p>}
      {!isLoading && !error && posts.length === 0 && <p className="muted">Постов пока нет.</p>}
      <div className="stack">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            reaction={reactions[post.id] ?? null}
            onReact={(reaction) => onReact(post.id, reaction)}
            onRemoveReaction={() => onRemoveReaction(post.id)}
          />
        ))}
      </div>
    </section>
  )
}
