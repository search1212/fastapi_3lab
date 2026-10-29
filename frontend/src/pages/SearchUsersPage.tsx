import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/client'
import { searchUsers } from '../api/users'
import { useAuth } from '../auth/AuthContext'
import { FormField } from '../components/ui/FormField'
import { GlassCard } from '../components/ui/GlassCard'
import { PageState } from '../components/ui/PageState'
import type { UserPublic } from '../types/api'

export function SearchUsersPage() {
  const { accessToken } = useAuth()
  const [searchText, setSearchText] = useState('')
  const [matches, setMatches] = useState<UserPublic[]>([])
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken || searchText.trim().length < 1) {
      setMatches([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      setErrorText(null)
      try {
        setMatches(await searchUsers(searchText.trim(), accessToken))
      } catch (failure) {
        setErrorText(failure instanceof ApiError ? failure.message : 'Не удалось выполнить поиск')
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [searchText, accessToken])

  return (
    <section>
      <GlassCard className="search-panel">
        <FormField label="Username или email">
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Введите запрос"
          />
        </FormField>
      </GlassCard>
      <PageState
        loading={loading ? 'Ищем...' : undefined}
        error={errorText}
        empty={!loading && searchText && matches.length === 0 ? 'Ничего не найдено.' : null}
      />
      <div className="search-results">
        {matches.map((person) => (
          <Link key={person.id} className="search-user-link" to={`/users/${person.id}`}>
            <GlassCard className="search-user-card">
              <div className="search-user-head">
                {person.avatar_url ? (
                  <img className="search-user-avatar" src={person.avatar_url} alt={`Аватар ${person.username}`} />
                ) : (
                  <span className="search-user-avatar search-user-avatar-fallback">
                    {person.username.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="search-user-main">
                  <strong>@{person.username}</strong>
                  <p className="muted">{person.email}</p>
                </div>
              </div>
              <p className="search-user-bio">{person.bio || 'Пользователь пока не добавил описание.'}</p>
              <div className="meta">
                <span>На сайте с {new Date(person.created_at).toLocaleDateString()}</span>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </section>
  )
}
