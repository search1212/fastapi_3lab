import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../api/auth'
import { ApiError } from '../api/client'

export function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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
        setError('Unexpected error during registration')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section>
      <h2>Register</h2>
      <form className="card form" onSubmit={onSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={50}
            required
          />
        </label>
        <label>
          Password
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
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
        {error && <p className="error">{error}</p>}
        {isSuccess && (
          <p className="success">
            Registered. Redirecting to login...
          </p>
        )}
        <p className="muted">
          Already have an account? <Link to="/login">Go to login</Link>
        </p>
      </form>
    </section>
  )
}
