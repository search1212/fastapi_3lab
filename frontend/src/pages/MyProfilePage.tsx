import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { UserPublic } from '../types/api'
import { ApiError } from '../api/client'
import { getMe, updateMe } from '../api/users'
import { useAuth } from '../auth/AuthContext'

export function MyProfilePage() {
  const { accessToken } = useAuth()
  const [profile, setProfile] = useState<UserPublic | null>(null)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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
      {isLoading && <p className="muted">Загрузка профиля...</p>}
      {error && <p className="error">{error}</p>}
      {!isLoading && profile && (
        <form className="card form" onSubmit={onSubmit}>
          <label>
            Email
            <input type="email" value={profile.email} disabled />
          </label>
          <label>
            Имя пользователя
            <input value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={50} />
          </label>
          <label>
            О себе
            <input value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1000} />
          </label>
          <label>
            URL аватарки
            <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} maxLength={1024} />
          </label>
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Сохраняем...' : 'Сохранить'}
          </button>
          {success && <p className="success">{success}</p>}
        </form>
      )}
    </section>
  )
}
