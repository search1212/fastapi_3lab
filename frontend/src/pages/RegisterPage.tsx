import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { checkEmailAvailability, checkUsernameAvailability, registerUser } from '../api/auth'
import { ApiError } from '../api/client'

type ValidationStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [emailStatus, setEmailStatus] = useState<ValidationStatus>('idle')
  const [usernameStatus, setUsernameStatus] = useState<ValidationStatus>('idle')

  useEffect(() => {
    if (!email) {
      setEmailStatus('idle')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailStatus('invalid')
      return
    }
    setEmailStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const result = await checkEmailAvailability(email)
        setEmailStatus(result.available ? 'available' : 'taken')
      } catch {
        setEmailStatus('idle')
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [email])

  useEffect(() => {
    if (!username) {
      setUsernameStatus('idle')
      return
    }
    if (username.length < 3) {
      setUsernameStatus('invalid')
      return
    }
    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(username)
        setUsernameStatus(result.available ? 'available' : 'taken')
      } catch {
        setUsernameStatus('idle')
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [username])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (emailStatus === 'taken' || usernameStatus === 'taken' || emailStatus === 'invalid' || usernameStatus === 'invalid') {
      setError('Проверьте email и username: есть ошибки валидации.')
      return
    }
    setIsLoading(true)
    setError(null)
    setIsSuccess(false)
    try {
      await registerUser({ email, username, password })
      setIsSuccess(true)
      setTimeout(() => navigate('/login'), 500)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Не удалось выполнить регистрацию.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="auth-page">
      <h2>Регистрация</h2>
      <form className="card form" onSubmit={onSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <ValidationHint status={emailStatus} takenText="Этот email уже занят." invalidText="Введите корректный email." />
        </label>
        <label>
          Имя пользователя
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={50}
            required
          />
          <ValidationHint
            status={usernameStatus}
            takenText="Это имя пользователя уже занято."
            invalidText="Минимум 3 символа."
          />
        </label>
        <label>
          Пароль
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            maxLength={128}
            required
          />
        </label>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Создаем аккаунт...' : 'Создать аккаунт'}
        </button>
        {error && <p className="error">{error}</p>}
        {isSuccess && (
          <p className="success">
            Регистрация успешна. Перенаправляем на вход...
          </p>
        )}
        <p className="muted">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </section>
  )
}

function ValidationHint({
  status,
  takenText,
  invalidText,
}: {
  status: ValidationStatus
  takenText: string
  invalidText: string
}) {
  if (status === 'checking') return <span className="hint checking">Проверяем...</span>
  if (status === 'available') return <span className="hint ok">Свободно</span>
  if (status === 'taken') return <span className="hint bad">{takenText}</span>
  if (status === 'invalid') return <span className="hint bad">{invalidText}</span>
  return null
}
