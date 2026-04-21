import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { apiRequest } from '../api/client'
import type { AuthResponse } from '../types/api'

const ACCESS_TOKEN_KEY = 'lab_access_token'
const REFRESH_TOKEN_KEY = 'lab_refresh_token'

interface AuthContextValue {
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (tokens: AuthResponse) => void
  logout: () => void
  authRequest: <T>(path: string, options?: RequestInit) => Promise<T>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readToken(key: string): string | null {
  return localStorage.getItem(key)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => readToken(ACCESS_TOKEN_KEY))
  const [refreshToken, setRefreshToken] = useState<string | null>(() => readToken(REFRESH_TOKEN_KEY))

  const login = (tokens: AuthResponse) => {
    setAccessToken(tokens.access_token)
    setRefreshToken(tokens.refresh_token)
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
  }

  const logout = () => {
    setAccessToken(null)
    setRefreshToken(null)
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken),
      login,
      logout,
      authRequest: <T,>(path: string, options?: RequestInit) =>
        apiRequest<T>(path, { ...options, token: accessToken }),
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
