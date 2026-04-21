import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function Layout() {
  const { isAuthenticated, logout } = useAuth()
  const { pathname } = useLocation()

  const getPageTitle = () => {
    if (!isAuthenticated) {
      if (pathname === '/register') return 'Регистрация'
      return 'Вход'
    }
    if (pathname === '/') return 'Лента'
    if (pathname === '/following') return 'Лента подписок'
    if (pathname === '/my-posts') return 'Мои посты'
    if (pathname === '/me') return 'Мой профиль'
    if (pathname === '/search') return 'Найти человека'
    if (pathname.startsWith('/users/')) return 'Профиль пользователя'
    return 'Wgram'
  }

  return (
    <div className="app-shell">
      <div className="bg-orb orb-left" />
      <div className="bg-orb orb-right" />
      <header className="header">
        <div className="container nav">
          <Link to="/" className="brand-button">
            <h1 className="brand">Wgram</h1>
          </Link>
          <div className="header-page-title">{getPageTitle()}</div>
        </div>
      </header>
      <div className="container workspace">
        <main className="content">
          <Outlet />
        </main>
        <aside className="right-menu glass-card">
          <nav className="menu menu-vertical">
            {isAuthenticated && (
              <>
                <NavLink to="/me" className={({ isActive }) => `menu-button ${isActive ? 'is-active' : ''}`}>
                  Мой профиль
                </NavLink>
                <NavLink to="/my-posts" className={({ isActive }) => `menu-button ${isActive ? 'is-active' : ''}`}>
                  Мои посты
                </NavLink>
                <NavLink to="/" className={({ isActive }) => `menu-button ${isActive ? 'is-active' : ''}`}>
                  Лента
                </NavLink>
                <NavLink to="/following" className={({ isActive }) => `menu-button ${isActive ? 'is-active' : ''}`}>
                  Лента подписок
                </NavLink>
                <NavLink to="/search" className={({ isActive }) => `menu-button ${isActive ? 'is-active' : ''}`}>
                  Найти человека
                </NavLink>
                <button type="button" onClick={logout} className="btn btn-secondary">
                  Выйти
                </button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <NavLink to="/login" className={({ isActive }) => `menu-button ${isActive ? 'is-active' : ''}`}>
                  Вход
                </NavLink>
                <NavLink to="/register" className={({ isActive }) => `menu-button ${isActive ? 'is-active' : ''}`}>
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
