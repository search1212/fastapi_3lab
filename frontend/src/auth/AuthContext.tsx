import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthResponse } from '../types/api'

const ACCESS_KEY = 'lab_access_token'
const REFRESH_KEY = 'lab_refresh_token'

interface AuthContextValue {
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (tokens: AuthResponse) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredToken(key: string): string | null {
  return localStorage.getItem(key)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => readStoredToken(ACCESS_KEY))
  const [refreshToken, setRefreshToken] = useState<string | null>(() => readStoredToken(REFRESH_KEY))

  const login = (tokens: AuthResponse) => {
    setAccessToken(tokens.access_token)
    setRefreshToken(tokens.refresh_token)
    localStorage.setItem(ACCESS_KEY, tokens.access_token)
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
  }

  const logout = () => {
    setAccessToken(null)
    setRefreshToken(null)
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken),
      login,
      logout,
    }),
    [accessToken, refreshToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
