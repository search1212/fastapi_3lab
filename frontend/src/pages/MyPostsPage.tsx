import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../api/client'
import { createPost, getMyPosts, updatePost } from '../api/posts'
import { useAuth } from '../auth/AuthContext'
import { PostCard } from '../components/PostCard'
import type { PostRead } from '../types/api'

export function MyPostsPage() {
  const { accessToken } = useAuth()
  const [posts, setPosts] = useState<PostRead[]>([])
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      setPosts(await getMyPosts(accessToken))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить посты')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [accessToken])

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!accessToken) return
    if (content.trim().length === 0) {
      setError('Текст поста не должен быть пустым')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const post = await createPost({ content }, accessToken)
      setPosts((prev) => [post, ...prev])
      setContent('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось создать пост')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSaveEdit = async () => {
    if (!accessToken || !editingId) return
    setError(null)
    try {
      const updated = await updatePost(editingId, { content: editingContent }, accessToken)
      setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)))
      setEditingId(null)
      setEditingContent('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сохранить пост')
    }
  }

  return (
    <section>
      <h2>Мои посты</h2>
      <form className="card form" onSubmit={onCreate}>
        <label>
          Новый пост
          <input value={content} onChange={(e) => setContent(e.target.value)} maxLength={5000} />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Публикуем...' : 'Опубликовать'}
        </button>
      </form>

      {editingId && (
        <div className="card form">
          <label>
            Редактирование поста
            <input value={editingContent} onChange={(e) => setEditingContent(e.target.value)} maxLength={5000} />
          </label>
          <div className="action-row">
            <button type="button" onClick={onSaveEdit}>
              Сохранить
            </button>
            <button type="button" className="ghost-button" onClick={() => setEditingId(null)}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}
      {isLoading && <p className="muted">Загрузка постов...</p>}
      {!isLoading && posts.length === 0 && <p className="muted">У вас пока нет постов.</p>}
      <div className="stack">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            editable
            onEdit={(picked) => {
              setEditingId(picked.id)
              setEditingContent(picked.content)
            }}
          />
        ))}
      </div>
    </section>
  )
}
