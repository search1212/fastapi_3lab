import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function Layout() {
  const { isAuthenticated, logout } = useAuth()

  return (
    <div className="app-shell">
      <header className="header">
        <div className="container nav">
          <h1 className="brand">FastAPI 3Lab</h1>
          <nav className="menu">
            <Link to="/">Feed</Link>
            <Link to="/register">Register</Link>
            <Link to="/login">Login</Link>
            {isAuthenticated && (
              <button type="button" onClick={logout} className="ghost-button">
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="container content">
        <Outlet />
      </main>
    </div>
  )
}
