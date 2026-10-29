import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getMe, updateMe } from '../api/users'
import { useAuth } from '../auth/AuthContext'
import { PrimaryButton, SecondaryButton } from '../components/ui/Buttons'
import { FormField } from '../components/ui/FormField'
import { GlassCard } from '../components/ui/GlassCard'
import { PageState } from '../components/ui/PageState'
import type { UserPublic } from '../types/api'

export function MyProfilePage() {
  const { accessToken } = useAuth()
  const [account, setAccount] = useState<UserPublic | null>(null)
  const [usernameValue, setUsernameValue] = useState('')
  const [bioValue, setBioValue] = useState('')
  const [avatarValue, setAvatarValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [successText, setSuccessText] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) return
    const loadProfile = async () => {
      setLoading(true)
      setErrorText(null)
      try {
        const user = await getMe(accessToken)
        setAccount(user)
        setUsernameValue(user.username)
        setBioValue(user.bio ?? '')
        setAvatarValue(user.avatar_url ?? '')
      } catch (failure) {
        setErrorText(failure instanceof ApiError ? failure.message : 'Не удалось загрузить профиль')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [accessToken])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!accessToken) return
    setSaving(true)
    setErrorText(null)
    setSuccessText(null)
    try {
      const updated = await updateMe(accessToken, {
        username: usernameValue,
        bio: bioValue,
        avatar_url: avatarValue,
      })
      setAccount(updated)
      setEditing(false)
      setSuccessText('Профиль обновлен')
    } catch (failure) {
      setErrorText(failure instanceof ApiError ? failure.message : 'Не удалось сохранить изменения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <PageState loading={loading ? 'Загрузка профиля...' : undefined} error={errorText} />
      {!loading && account && (
        <GlassCard className="profile-card">
          <form className="form profile-form" onSubmit={handleSubmit}>
            <FormField label="Email">
              <input type="email" value={account.email} disabled />
            </FormField>
            <FormField label="Имя пользователя">
              <input
                value={usernameValue}
                onChange={(event) => setUsernameValue(event.target.value)}
                minLength={3}
                maxLength={50}
                disabled={!editing}
              />
            </FormField>
            <FormField label="О себе">
              <input
                value={bioValue}
                onChange={(event) => setBioValue(event.target.value)}
                maxLength={1000}
                disabled={!editing}
              />
            </FormField>
            <FormField label="URL аватарки">
              <input
                value={avatarValue}
                onChange={(event) => setAvatarValue(event.target.value)}
                maxLength={1024}
                disabled={!editing}
              />
            </FormField>
            <div className="action-row">
              {!editing && (
                <SecondaryButton type="button" onClick={() => setEditing(true)}>
                  Изменить профиль
                </SecondaryButton>
              )}
              {editing && (
                <>
                  <PrimaryButton type="submit" disabled={saving}>
                    {saving ? 'Сохраняем...' : 'Сохранить'}
                  </PrimaryButton>
                  <SecondaryButton type="button" onClick={() => setEditing(false)}>
                    Отмена
                  </SecondaryButton>
                </>
              )}
              <Link to="/my-posts" className="menu-button">
                Перейти к постам
              </Link>
            </div>
            {successText && <p className="success">{successText}</p>}
          </form>
          <div className="profile-photo-wrap">
            {avatarValue ? (
              <img className="profile-photo" src={avatarValue} alt="Аватар профиля" />
            ) : (
              <div className="profile-photo-placeholder">Нет фото</div>
            )}
          </div>
        </GlassCard>
      )}
    </section>
  )
}
