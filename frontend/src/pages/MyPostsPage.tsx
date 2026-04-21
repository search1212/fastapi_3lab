import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../api/client'
import { createPost, getMyPosts, updatePost } from '../api/posts'
import { useAuth } from '../auth/AuthContext'
import { PostCard } from '../components/PostCard'
import { PrimaryButton, SecondaryButton } from '../components/ui/Buttons'
import { FormField } from '../components/ui/FormField'
import { GlassCard } from '../components/ui/GlassCard'
import { PageState } from '../components/ui/PageState'
import type { PostRead } from '../types/api'

export function MyPostsPage() {
  const { accessToken } = useAuth()
  const [posts, setPosts] = useState<PostRead[]>([])
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
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

  const onCancelEdit = () => {
    setEditingId(null)
    setEditingContent('')
  }

  return (
    <section>
      <GlassCard>
        <form className="form" onSubmit={onCreate}>
          <FormField label="Новый пост">
            <textarea
              className="post-editor-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
              rows={4}
              placeholder="Что нового?"
            />
          </FormField>
          <div className="editor-meta">{content.trim().length}/5000</div>
          <PrimaryButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Публикуем...' : 'Опубликовать'}
          </PrimaryButton>
        </form>
      </GlassCard>

      {editingId && (
        <GlassCard className="post-edit-panel">
          <div className="post-edit-head">
            <strong>Редактирование поста</strong>
            <span className="muted">Пост #{editingId}</span>
          </div>
          <FormField label="Новый текст">
            <textarea
              className="post-editor-input"
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              maxLength={5000}
              rows={5}
              autoFocus
            />
          </FormField>
          <div className="editor-meta">{editingContent.trim().length}/5000</div>
          <div className="action-row post-edit-actions">
            <PrimaryButton type="button" onClick={onSaveEdit}>
              Сохранить
            </PrimaryButton>
            <SecondaryButton type="button" onClick={onCancelEdit}>
              Отмена
            </SecondaryButton>
          </div>
        </GlassCard>
      )}

      <PageState
        error={error}
        loading={isLoading ? 'Загрузка постов...' : undefined}
        empty={!isLoading && posts.length === 0 ? 'У вас пока нет постов.' : null}
      />
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
