import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const APP_NAME = 'Sfera'

function resolveTitle(pathname: string, authenticated: boolean): string {
  if (!authenticated) {
    return pathname === '/register' ? 'Регистрация' : 'Вход'
  }
  if (pathname === '/') return 'Лента'
  if (pathname === '/following') return 'Лента подписок'
  if (pathname === '/my-posts') return 'Мои посты'
  if (pathname === '/me') return 'Мой профиль'
  if (pathname === '/search') return 'Найти человека'
  if (pathname.startsWith('/users/')) return 'Профиль пользователя'
  return APP_NAME
}

export function Layout() {
  const { isAuthenticated, logout } = useAuth()
  const { pathname } = useLocation()

  const linkClass = ({ isActive }: { isActive: boolean }) => `menu-button ${isActive ? 'is-active' : ''}`

  return (
    <div className="app-shell">
      <header className="header">
        <div className="container nav">
          <Link to="/" className="brand-button">
            <h1 className="brand">{APP_NAME}</h1>
          </Link>
          <p className="brand-tagline">социальная сеть</p>
        </div>
      </header>
      <div className="container workspace">
        <main className="content">
          {isAuthenticated && (
            <div className="page-head">
              <div className="page-title">{resolveTitle(pathname, isAuthenticated)}</div>
            </div>
          )}
          <div className="page-enter" key={pathname}>
            <Outlet />
          </div>
        </main>
        <aside className="right-menu">
          <div className="menu-label">{isAuthenticated ? 'Навигация' : 'Добро пожаловать'}</div>
          <nav className="menu menu-vertical">
            {isAuthenticated ? (
              <>
                <NavLink to="/me" className={linkClass}>
                  Мой профиль
                </NavLink>
                <NavLink to="/my-posts" className={linkClass}>
                  Мои посты
                </NavLink>
                <NavLink to="/" className={linkClass}>
                  Лента
                </NavLink>
                <NavLink to="/following" className={linkClass}>
                  Лента подписок
                </NavLink>
                <NavLink to="/search" className={linkClass}>
                  Найти человека
                </NavLink>
                <button type="button" onClick={logout} className="btn btn-secondary menu-logout">
                  Выйти
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>
                  Вход
                </NavLink>
                <NavLink to="/register" className={linkClass}>
                  Регистрация
                </NavLink>
              </>
            )}
          </nav>
        </aside>
      </div>
    </div>
  )
}
