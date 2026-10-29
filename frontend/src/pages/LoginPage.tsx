import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../api/auth'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { PrimaryButton } from '../components/ui/Buttons'
import { FormField } from '../components/ui/FormField'
import { GlassCard } from '../components/ui/GlassCard'
import { PageState } from '../components/ui/PageState'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [emailValue, setEmailValue] = useState('')
  const [passwordValue, setPasswordValue] = useState('')
  const [pending, setPending] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    setErrorText(null)
    try {
      const tokens = await loginUser({ email: emailValue, password: passwordValue })
      login(tokens)
      navigate('/')
    } catch (failure) {
      setErrorText(failure instanceof ApiError ? failure.message : 'Не удалось выполнить вход.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="auth-page">
      <h2>Вход</h2>
      <GlassCard>
        <form className="form" onSubmit={handleSubmit}>
          <FormField label="Email">
            <input
              type="email"
              value={emailValue}
              onChange={(event) => setEmailValue(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Пароль">
            <input
              type="password"
              value={passwordValue}
              onChange={(event) => setPasswordValue(event.target.value)}
              required
            />
          </FormField>
          <PrimaryButton type="submit" disabled={pending}>
            {pending ? 'Входим...' : 'Войти'}
          </PrimaryButton>
          <PageState error={errorText} />
          <p className="muted">
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </form>
      </GlassCard>
    </section>
  )
}
