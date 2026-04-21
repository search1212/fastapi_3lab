import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { followUser, getFollowers, getFollowing, getMe, getUserById, unfollowUser } from '../api/users'
import type { UserPublic } from '../types/api'

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
    if (!accessToken || !userId) return
    setIsLoading(true)
    setError(null)
    try {
      const [user, me, followers, following] = await Promise.all([
        getUserById(userId, accessToken),
        getMe(accessToken),
        getFollowers(userId, accessToken),
        getFollowing(userId, accessToken),
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
      <h2>Профиль пользователя</h2>
      {isLoading && <p className="muted">Загрузка...</p>}
      {error && <p className="error">{error}</p>}
      {!isLoading && profile && (
        <article className="card form">
          <p>
            <strong>{profile.username}</strong>
          </p>
          <p className="muted">{profile.email}</p>
          <p>{profile.bio ?? 'Нет описания'}</p>
          <div className="meta">
            <span>Подписчики: {followersCount}</span>
            <span>Подписки: {followingCount}</span>
          </div>
          <button type="button" onClick={onToggleFollow}>
            {isFollowing ? 'Отписаться' : 'Подписаться'}
          </button>
        </article>
      )}
    </section>
  )
}
