import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { followUser, getFollowers, getFollowing, getMe, getUserById, unfollowUser } from '../api/users'
import { useAuth } from '../auth/AuthContext'
import { PrimaryButton } from '../components/ui/Buttons'
import { GlassCard } from '../components/ui/GlassCard'
import { PageState } from '../components/ui/PageState'
import type { UserPublic } from '../types/api'

export function UserProfilePage() {
  const { userId = '' } = useParams()
  const { accessToken } = useAuth()
  const [account, setAccount] = useState<UserPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [followed, setFollowed] = useState(false)
  const [followersTotal, setFollowersTotal] = useState(0)
  const [followingTotal, setFollowingTotal] = useState(0)
  const [errorText, setErrorText] = useState<string | null>(null)

  const loadProfile = async () => {
    const numericId = Number(userId)
    if (!accessToken || !userId || Number.isNaN(numericId)) return

    setLoading(true)
    setErrorText(null)
    try {
      const [person, me, followers, following] = await Promise.all([
        getUserById(numericId, accessToken),
        getMe(accessToken),
        getFollowers(numericId, accessToken),
        getFollowing(numericId, accessToken),
      ])
      setAccount(person)
      setFollowersTotal(followers.length)
      setFollowingTotal(following.length)
      setFollowed(followers.some((entry) => entry.id === me.id))
    } catch (failure) {
      setErrorText(failure instanceof ApiError ? failure.message : 'Не удалось загрузить профиль пользователя')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [accessToken, userId])

  const handleToggleFollow = async () => {
    if (!accessToken || !account) return
    try {
      if (followed) {
        await unfollowUser(account.id, accessToken)
        setFollowed(false)
        setFollowersTotal((value) => Math.max(0, value - 1))
      } else {
        await followUser(account.id, accessToken)
        setFollowed(true)
        setFollowersTotal((value) => value + 1)
      }
    } catch (failure) {
      setErrorText(failure instanceof ApiError ? failure.message : 'Не удалось изменить подписку')
    }
  }

  return (
    <section>
      <PageState loading={loading ? 'Загрузка...' : undefined} error={errorText} />
      {!loading && account && (
        <GlassCard className="user-profile-card">
          <div className="user-profile-main">
            <div className="user-profile-head">
              {account.avatar_url ? (
                <img className="user-profile-avatar" src={account.avatar_url} alt={`Аватар ${account.username}`} />
              ) : (
                <span className="user-profile-avatar user-profile-avatar-fallback">
                  {account.username.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="user-profile-title">
                <strong>@{account.username}</strong>
                <p className="muted">{account.email}</p>
              </div>
            </div>
            <p className="user-profile-bio">{account.bio ?? 'Пользователь пока не добавил описание.'}</p>
            <div className="user-profile-stats">
              <span className="stat-pill">Подписчики: {followersTotal}</span>
              <span className="stat-pill">Подписки: {followingTotal}</span>
              <span className="stat-pill">На сайте с {new Date(account.created_at).toLocaleDateString()}</span>
            </div>
            <div className="action-row user-profile-actions">
              <PrimaryButton type="button" className="user-profile-follow-btn" onClick={handleToggleFollow}>
                {followed ? 'Отписаться' : 'Подписаться'}
              </PrimaryButton>
            </div>
          </div>
          <div className="profile-photo-wrap">
            {account.avatar_url ? (
              <img className="profile-photo" src={account.avatar_url} alt={`Фото ${account.username}`} />
            ) : (
              <div className="profile-photo-placeholder">Нет фото</div>
            )}
          </div>
        </GlassCard>
      )}
    </section>
  )
}
