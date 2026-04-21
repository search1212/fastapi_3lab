import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function Layout() {
  const { isAuthenticated, logout } = useAuth()

  return (
    <div className="app-shell">
      <header className="header">
        <div className="container nav">
          <Link to="/" className="brand-button">
            <h1 className="brand">Wgram</h1>
          </Link>
          <nav className="menu">
            <NavLink to="/" className={({ isActive }) => `menu-button ${isActive ? 'is-active' : ''}`}>
              Лента
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => `menu-button ${isActive ? 'is-active' : ''}`}>
              Регистрация
            </NavLink>
            <NavLink to="/login" className={({ isActive }) => `menu-button ${isActive ? 'is-active' : ''}`}>
              Вход
            </NavLink>
            {isAuthenticated && (
              <button type="button" onClick={logout} className="ghost-button">
                Выйти
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
