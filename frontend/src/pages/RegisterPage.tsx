import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { checkEmailAvailability, checkUsernameAvailability, registerUser } from '../api/auth'
import { ApiError } from '../api/client'
import { PrimaryButton } from '../components/ui/Buttons'
import { FormField } from '../components/ui/FormField'
import { GlassCard } from '../components/ui/GlassCard'
import { PageState } from '../components/ui/PageState'
import { PasswordField } from '../components/ui/PasswordField'

type FieldStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

function AvailabilityHint({
  status,
  takenText,
  invalidText,
}: {
  status: FieldStatus
  takenText: string
  invalidText: string
}) {
  if (status === 'checking') return <span className="hint checking">Проверяем...</span>
  if (status === 'available') return <span className="hint ok">Свободно</span>
  if (status === 'taken') return <span className="hint bad">{takenText}</span>
  if (status === 'invalid') return <span className="hint bad">{invalidText}</span>
  return null
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [emailValue, setEmailValue] = useState('')
  const [usernameValue, setUsernameValue] = useState('')
  const [passwordValue, setPasswordValue] = useState('')
  const [pending, setPending] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [registered, setRegistered] = useState(false)
  const [emailStatus, setEmailStatus] = useState<FieldStatus>('idle')
  const [usernameStatus, setUsernameStatus] = useState<FieldStatus>('idle')

  useEffect(() => {
    if (!emailValue) {
      setEmailStatus('idle')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setEmailStatus('invalid')
      return
    }
    setEmailStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const result = await checkEmailAvailability(emailValue)
        setEmailStatus(result.available ? 'available' : 'taken')
      } catch {
        setEmailStatus('idle')
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [emailValue])

  useEffect(() => {
    if (!usernameValue) {
      setUsernameStatus('idle')
      return
    }
    if (usernameValue.length < 3) {
      setUsernameStatus('invalid')
      return
    }
    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(usernameValue)
        setUsernameStatus(result.available ? 'available' : 'taken')
      } catch {
        setUsernameStatus('idle')
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [usernameValue])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (
      emailStatus === 'taken' ||
      usernameStatus === 'taken' ||
      emailStatus === 'invalid' ||
      usernameStatus === 'invalid'
    ) {
      setErrorText('Проверьте email и имя пользователя: есть ошибки валидации.')
      return
    }

    setPending(true)
    setErrorText(null)
    setRegistered(false)
    try {
      await registerUser({ email: emailValue, username: usernameValue, password: passwordValue })
      setRegistered(true)
      setTimeout(() => navigate('/login'), 500)
    } catch (failure) {
      setErrorText(failure instanceof ApiError ? failure.message : 'Не удалось выполнить регистрацию.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="auth-page">
      <h2>Регистрация</h2>
      <GlassCard>
        <form className="form" onSubmit={handleSubmit}>
          <FormField
            label="Email"
            hint={
              <AvailabilityHint
                status={emailStatus}
                takenText="Этот email уже занят."
                invalidText="Введите корректный email."
              />
            }
          >
            <input
              type="email"
              value={emailValue}
              onChange={(event) => setEmailValue(event.target.value)}
              required
              autoComplete="email"
            />
          </FormField>
          <FormField
            label="Имя пользователя"
            hint={
              <AvailabilityHint
                status={usernameStatus}
                takenText="Это имя пользователя уже занято."
                invalidText="Минимум 3 символа."
              />
            }
          >
            <input
              type="text"
              value={usernameValue}
              onChange={(event) => setUsernameValue(event.target.value)}
              minLength={3}
              maxLength={50}
              required
              autoComplete="username"
            />
          </FormField>
          <PasswordField
            label="Пароль"
            value={passwordValue}
            onChange={(event) => setPasswordValue(event.target.value)}
            minLength={8}
            maxLength={128}
            required
            autoComplete="new-password"
          />
          <PrimaryButton type="submit" disabled={pending}>
            {pending ? 'Создаем аккаунт...' : 'Создать аккаунт'}
          </PrimaryButton>
          <PageState error={errorText} />
          {registered && <p className="success">Регистрация успешна. Перенаправляем на вход...</p>}
          <p className="muted">
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </form>
      </GlassCard>
    </section>
  )
}
