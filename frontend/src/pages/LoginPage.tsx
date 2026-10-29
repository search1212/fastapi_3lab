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
import { PasswordField } from '../components/ui/PasswordField'

function mapLoginError(message: string): string {
  const normalized = message.toLowerCase()
  if (
    normalized.includes('invalid credentials') ||
    normalized.includes('unauthorized') ||
    normalized.includes('неверн')
  ) {
    return 'Неверный логин или пароль'
  }
  return message
}

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
      if (failure instanceof ApiError) {
        setErrorText(mapLoginError(failure.message))
      } else {
        setErrorText('Не удалось выполнить вход.')
      }
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
              autoComplete="email"
            />
          </FormField>
          <PasswordField
            label="Пароль"
            value={passwordValue}
            onChange={(event) => setPasswordValue(event.target.value)}
            required
            autoComplete="current-password"
          />
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
