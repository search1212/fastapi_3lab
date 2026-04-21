import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { UserPublic } from '../types/api'
import { ApiError } from '../api/client'
import { getMe, updateMe } from '../api/users'
import { useAuth } from '../auth/AuthContext'
import { PrimaryButton, SecondaryButton } from '../components/ui/Buttons'
import { FormField } from '../components/ui/FormField'
import { GlassCard } from '../components/ui/GlassCard'
import { PageState } from '../components/ui/PageState'

export function MyProfilePage() {
  const { accessToken } = useAuth()
  const [profile, setProfile] = useState<UserPublic | null>(null)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) return
    const run = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const user = await getMe(accessToken)
        setProfile(user)
        setUsername(user.username)
        setBio(user.bio ?? '')
        setAvatarUrl(user.avatar_url ?? '')
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Не удалось загрузить профиль')
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [accessToken])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!accessToken) return
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await updateMe(accessToken, {
        username,
        bio,
        avatar_url: avatarUrl,
      })
      setProfile(updated)
      setIsEditing(false)
      setSuccess('Профиль обновлен')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сохранить изменения')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section>
      <h2>Мой профиль</h2>
      <PageState loading={isLoading ? 'Загрузка профиля...' : undefined} error={error} />
      {!isLoading && profile && (
        <GlassCard className="profile-card">
          <form className="form profile-form" onSubmit={onSubmit}>
            <FormField label="Email">
              <input type="email" value={profile.email} disabled />
            </FormField>
            <FormField label="Имя пользователя">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                maxLength={50}
                disabled={!isEditing}
              />
            </FormField>
            <FormField label="О себе">
              <input value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1000} disabled={!isEditing} />
            </FormField>
            <FormField label="URL аватарки">
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                maxLength={1024}
                disabled={!isEditing}
              />
            </FormField>
            <div className="action-row">
              {!isEditing && (
                <SecondaryButton type="button" onClick={() => setIsEditing(true)}>
                  Изменить профиль
                </SecondaryButton>
              )}
              {isEditing && (
                <>
                  <PrimaryButton type="submit" disabled={isSaving}>
                    {isSaving ? 'Сохраняем...' : 'Сохранить'}
                  </PrimaryButton>
                  <SecondaryButton type="button" onClick={() => setIsEditing(false)}>
                    Отмена
                  </SecondaryButton>
                </>
              )}
              <Link to="/my-posts" className="menu-button">
                Перейти к постам
              </Link>
            </div>
            {success && <p className="success">{success}</p>}
          </form>
          <div className="profile-photo-wrap">
            {avatarUrl ? (
              <img className="profile-photo" src={avatarUrl} alt="Аватар профиля" />
            ) : (
              <div className="profile-photo-placeholder">Нет фото</div>
            )}
          </div>
        </GlassCard>
      )}
    </section>
  )
}
