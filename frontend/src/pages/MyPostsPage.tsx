import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../api/client'
import { createPost, getMyPosts, updatePost } from '../api/posts'
import { getMe } from '../api/users'
import { useAuth } from '../auth/AuthContext'
import { PostCard } from '../components/PostCard'
import { PrimaryButton, SecondaryButton } from '../components/ui/Buttons'
import { FormField } from '../components/ui/FormField'
import { GlassCard } from '../components/ui/GlassCard'
import { PageState } from '../components/ui/PageState'
import type { PostAuthorPreview, PostRead } from '../types/api'

export function MyPostsPage() {
  const { accessToken } = useAuth()
  const [items, setItems] = useState<PostRead[]>([])
  const [mePreview, setMePreview] = useState<PostAuthorPreview | null>(null)
  const [draftText, setDraftText] = useState('')
  const [editTargetId, setEditTargetId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  const fetchPosts = async () => {
    if (!accessToken) return
    setLoading(true)
    setErrorText(null)
    try {
      const [posts, profile] = await Promise.all([getMyPosts(accessToken), getMe(accessToken)])
      setItems(posts)
      setMePreview({
        id: profile.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
      })
    } catch (failure) {
      setErrorText(failure instanceof ApiError ? failure.message : 'Не удалось загрузить посты')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [accessToken])

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!accessToken) return
    if (draftText.trim().length === 0) {
      setErrorText('Текст поста не должен быть пустым')
      return
    }

    setSaving(true)
    setErrorText(null)
    try {
      const created = await createPost({ content: draftText }, accessToken)
      setItems((previous) => [created, ...previous])
      setDraftText('')
    } catch (failure) {
      setErrorText(failure instanceof ApiError ? failure.message : 'Не удалось создать пост')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!accessToken || !editTargetId) return
    setErrorText(null)
    try {
      const updated = await updatePost(editTargetId, { content: editDraft }, accessToken)
      setItems((previous) => previous.map((entry) => (entry.id === updated.id ? updated : entry)))
      setEditTargetId(null)
      setEditDraft('')
    } catch (failure) {
      setErrorText(failure instanceof ApiError ? failure.message : 'Не удалось сохранить пост')
    }
  }

  const handleCancelEdit = () => {
    setEditTargetId(null)
    setEditDraft('')
  }

  return (
    <section>
      <GlassCard>
        <form className="form" onSubmit={handleCreate}>
          <FormField label="Новый пост">
            <textarea
              className="post-editor-input"
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              maxLength={5000}
              rows={4}
              placeholder="Что нового?"
            />
          </FormField>
          <div className="editor-meta">{draftText.trim().length}/5000</div>
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? 'Публикуем...' : 'Опубликовать'}
          </PrimaryButton>
        </form>
      </GlassCard>

      {editTargetId && (
        <GlassCard className="post-edit-panel">
          <div className="post-edit-head">
            <strong>Редактирование поста</strong>
            <span className="muted">Пост #{editTargetId}</span>
          </div>
          <FormField label="Новый текст">
            <textarea
              className="post-editor-input"
              value={editDraft}
              onChange={(event) => setEditDraft(event.target.value)}
              maxLength={5000}
              rows={5}
              autoFocus
            />
          </FormField>
          <div className="editor-meta">{editDraft.trim().length}/5000</div>
          <div className="action-row post-edit-actions">
            <PrimaryButton type="button" onClick={handleSaveEdit}>
              Сохранить
            </PrimaryButton>
            <SecondaryButton type="button" onClick={handleCancelEdit}>
              Отмена
            </SecondaryButton>
          </div>
        </GlassCard>
      )}

      <PageState
        error={errorText}
        loading={loading ? 'Загрузка постов...' : undefined}
        empty={!loading && items.length === 0 ? 'У вас пока нет постов.' : null}
      />
      <div className="stack">
        {items.map((entry) => (
          <PostCard
            key={entry.id}
            post={entry}
            author={mePreview ?? undefined}
            isOwnAuthor
            editable
            onEdit={(picked) => {
              setEditTargetId(picked.id)
              setEditDraft(picked.content)
            }}
          />
        ))}
      </div>
    </section>
  )
}
