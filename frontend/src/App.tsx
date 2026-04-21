import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactElement } from 'react'
import { useAuth } from './auth/AuthContext'
import { Layout } from './components/Layout'
import { FollowingFeedPage } from './pages/FollowingFeedPage'
import { GlobalFeedPage } from './pages/GlobalFeedPage'
import { LoginPage } from './pages/LoginPage'
import { MyPostsPage } from './pages/MyPostsPage'
import { MyProfilePage } from './pages/MyProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { SearchUsersPage } from './pages/SearchUsersPage'
import { UserProfilePage } from './pages/UserProfilePage'

function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

function RequireGuest({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return children
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            <RequireAuth>
              <GlobalFeedPage />
            </RequireAuth>
          }
        />
        <Route
          path="/me"
          element={
            <RequireAuth>
              <MyProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/my-posts"
          element={
            <RequireAuth>
              <MyPostsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/following"
          element={
            <RequireAuth>
              <FollowingFeedPage />
            </RequireAuth>
          }
        />
        <Route
          path="/search"
          element={
            <RequireAuth>
              <SearchUsersPage />
            </RequireAuth>
          }
        />
        <Route
          path="/users/:userId"
          element={
            <RequireAuth>
              <UserProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/login"
          element={
            <RequireGuest>
              <LoginPage />
            </RequireGuest>
          }
        />
        <Route
          path="/register"
          element={
            <RequireGuest>
              <RegisterPage />
            </RequireGuest>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>
    </Routes>
  )
}

export default App
