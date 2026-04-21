import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { searchUsers } from '../api/users'
import type { UserPublic } from '../types/api'
import { FormField } from '../components/ui/FormField'
import { GlassCard } from '../components/ui/GlassCard'
import { PageState } from '../components/ui/PageState'

export function SearchUsersPage() {
  const { accessToken } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserPublic[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken || query.trim().length < 1) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setIsLoading(true)
      setError(null)
      try {
        setResults(await searchUsers(query.trim(), accessToken))
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Не удалось выполнить поиск')
      } finally {
        setIsLoading(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [query, accessToken])

  return (
    <section>
      <GlassCard className="search-panel">
        <FormField label="Username или email">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Введите запрос" />
        </FormField>
      </GlassCard>
      <PageState
        loading={isLoading ? 'Ищем...' : undefined}
        error={error}
        empty={!isLoading && query && results.length === 0 ? 'Ничего не найдено.' : null}
      />
      <div className="search-results">
        {results.map((user) => (
          <Link key={user.id} className="search-user-link" to={`/users/${user.id}`}>
            <GlassCard className="search-user-card">
              <div className="search-user-head">
                {user.avatar_url ? (
                  <img className="search-user-avatar" src={user.avatar_url} alt={`Аватар ${user.username}`} />
                ) : (
                  <span className="search-user-avatar search-user-avatar-fallback">{user.username.slice(0, 1).toUpperCase()}</span>
                )}
                <div className="search-user-main">
                  <strong>@{user.username}</strong>
                  <p className="muted">{user.email}</p>
                </div>
              </div>
              <p className="search-user-bio">{user.bio || 'Пользователь пока не добавил описание.'}</p>
              <div className="meta">
                <span>На сайте с {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </section>
  )
}
