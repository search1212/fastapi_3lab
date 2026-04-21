import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../api/auth'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { GlassCard } from '../components/ui/GlassCard'
import { FormField } from '../components/ui/FormField'
import { PrimaryButton } from '../components/ui/Buttons'
import { PageState } from '../components/ui/PageState'

export function LoginPage() {
  const navigate = useNavigate()
  const auth = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const tokens = await loginUser({ email, password })
      auth.login(tokens)
      navigate('/')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Не удалось выполнить вход.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="auth-page">
      <h2>Вход</h2>
      <GlassCard>
        <form className="form" onSubmit={onSubmit}>
          <FormField label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </FormField>
          <FormField label="Пароль">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </FormField>
          <PrimaryButton type="submit" disabled={isLoading}>
            {isLoading ? 'Входим...' : 'Войти'}
          </PrimaryButton>
          <PageState error={error} />
          <p className="muted">
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </form>
      </GlassCard>
    </section>
  )
}
