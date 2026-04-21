import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { followUser, getFollowers, getFollowing, getMe, getUserById, unfollowUser } from '../api/users'
import type { UserPublic } from '../types/api'
import { PrimaryButton } from '../components/ui/Buttons'
import { GlassCard } from '../components/ui/GlassCard'
import { PageState } from '../components/ui/PageState'

export function UserProfilePage() {
  const { userId = '' } = useParams()
  const { accessToken } = useAuth()
  const [profile, setProfile] = useState<UserPublic | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const parsedUserId = Number(userId)
    if (!accessToken || !userId || Number.isNaN(parsedUserId)) return
    setIsLoading(true)
    setError(null)
    try {
      const [user, me, followers, following] = await Promise.all([
        getUserById(parsedUserId, accessToken),
        getMe(accessToken),
        getFollowers(parsedUserId, accessToken),
        getFollowing(parsedUserId, accessToken),
      ])
      setProfile(user)
      setFollowersCount(followers.length)
      setFollowingCount(following.length)
      setIsFollowing(followers.some((u) => u.id === me.id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить профиль пользователя')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [accessToken, userId])

  const onToggleFollow = async () => {
    if (!accessToken || !profile) return
    try {
      if (isFollowing) {
        await unfollowUser(profile.id, accessToken)
        setIsFollowing(false)
        setFollowersCount((v) => Math.max(0, v - 1))
      } else {
        await followUser(profile.id, accessToken)
        setIsFollowing(true)
        setFollowersCount((v) => v + 1)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось изменить подписку')
    }
  }

  return (
    <section>
      <PageState loading={isLoading ? 'Загрузка...' : undefined} error={error} />
      {!isLoading && profile && (
        <GlassCard className="user-profile-card">
          <div className="user-profile-main">
            <div className="user-profile-head">
              {profile.avatar_url ? (
                <img className="user-profile-avatar" src={profile.avatar_url} alt={`Аватар ${profile.username}`} />
              ) : (
                <span className="user-profile-avatar user-profile-avatar-fallback">
                  {profile.username.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="user-profile-title">
                <strong>@{profile.username}</strong>
                <p className="muted">{profile.email}</p>
              </div>
            </div>
            <p className="user-profile-bio">{profile.bio ?? 'Пользователь пока не добавил описание.'}</p>
            <div className="user-profile-stats">
              <span className="stat-pill">Подписчики: {followersCount}</span>
              <span className="stat-pill">Подписки: {followingCount}</span>
              <span className="stat-pill">На сайте с {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
            <div className="action-row user-profile-actions">
              <PrimaryButton type="button" className="user-profile-follow-btn" onClick={onToggleFollow}>
                {isFollowing ? 'Отписаться' : 'Подписаться'}
              </PrimaryButton>
            </div>
          </div>
          <div className="profile-photo-wrap">
            {profile.avatar_url ? (
              <img className="profile-photo" src={profile.avatar_url} alt={`Фото ${profile.username}`} />
            ) : (
              <div className="profile-photo-placeholder">Нет фото</div>
            )}
          </div>
        </GlassCard>
      )}
    </section>
  )
}
