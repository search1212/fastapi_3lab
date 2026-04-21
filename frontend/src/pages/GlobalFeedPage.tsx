import { useEffect, useState } from 'react'
import { getGlobalFeed } from '../api/posts'
import { ApiError } from '../api/client'
import { PostCard } from '../components/PostCard'
import type { PostRead } from '../types/api'

export function GlobalFeedPage() {
  const [posts, setPosts] = useState<PostRead[]>([])
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
          setError('Unexpected error while loading feed')
        }
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [])

  return (
    <section>
      <h2>Общая лента</h2>
      {isLoading && <p className="muted">Загружаем посты...</p>}
      {error && <p className="error">{error}</p>}
      {!isLoading && !error && posts.length === 0 && <p className="muted">Постов пока нет.</p>}
      <div className="stack">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}
