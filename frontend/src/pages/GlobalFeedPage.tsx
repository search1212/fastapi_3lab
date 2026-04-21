import { useEffect, useState } from 'react'
import { getGlobalFeed, getMyReactions } from '../api/posts'
import { ApiError } from '../api/client'
import { removeReaction, setReaction } from '../api/posts'
import { useAuth } from '../auth/AuthContext'
import { PostCard } from '../components/PostCard'
import { PageState } from '../components/ui/PageState'
import type { PostRead, ReactionType } from '../types/api'

export function GlobalFeedPage() {
  const { accessToken } = useAuth()
  const [posts, setPosts] = useState<PostRead[]>([])
  const [reactions, setReactions] = useState<Record<number, ReactionType | null>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getGlobalFeed()
        setPosts(data)
        if (accessToken) {
          const existingReactions = await getMyReactions(accessToken)
          setReactions(
            Object.fromEntries(existingReactions.map((item) => [item.post_id, item.reaction_type])) as Record<
              number,
              ReactionType | null
            >,
          )
        }
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
  }, [accessToken])

  const onReact = async (postId: number, reaction: ReactionType) => {
    if (!accessToken) return
    try {
      await setReaction(postId, reaction, accessToken)
      setReactions((prev) => ({ ...prev, [postId]: reaction }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось поставить реакцию')
    }
  }

  const onRemoveReaction = async (postId: number) => {
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
      <PageState
        loading={isLoading ? 'Загружаем посты...' : undefined}
        error={error}
        empty={!isLoading && !error && posts.length === 0 ? 'Постов пока нет.' : null}
      />
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
