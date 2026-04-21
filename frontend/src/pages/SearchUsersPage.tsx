import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { searchUsers } from '../api/users'
import type { UserPublic } from '../types/api'

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
      <h2>Поиск пользователей</h2>
      <div className="card form">
        <label>
          Username или email
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Введите запрос" />
        </label>
      </div>
      {isLoading && <p className="muted">Ищем...</p>}
      {error && <p className="error">{error}</p>}
      {!isLoading && query && results.length === 0 && <p className="muted">Ничего не найдено.</p>}
      <div className="stack">
        {results.map((user) => (
          <article className="card" key={user.id}>
            <p>{user.username}</p>
            <p className="muted">{user.email}</p>
            <Link className="menu-button" to={`/users/${user.id}`}>
              Открыть профиль
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
