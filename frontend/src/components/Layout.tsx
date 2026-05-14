import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../lib/api'

export default function Layout() {
  const { user, isAuth, logout } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/')
  }

  const navLinks = [
    { to: '/', label: 'Главная' },
    { to: '/simulator', label: 'Симулятор' },
    { to: '/constructor', label: 'Конструктор' },
    { to: '/library', label: 'Библиотека' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-surface-200">
        <div className="page-container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                </svg>
              </div>
              <span className="font-bold text-lg text-surface-900">A11y<span className="text-primary-600">Platform</span></span>
            </NavLink>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Основная навигация">
              {navLinks.map(({ to, label }) => (
                <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'}`
                }>
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Auth */}
            <div className="hidden md:flex items-center gap-2">
              {isAuth ? (
                <>
                  <NavLink to="/cabinet" className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'}`
                  }>
                    {user?.email?.split('@')[0]}
                  </NavLink>
                  <button onClick={handleLogout} className="btn-ghost text-sm">Выйти</button>
                </>
              ) : (
                <NavLink to="/auth" className="btn-primary">Войти</NavLink>
              )}
            </div>

            {/* Burger */}
            <button className="md:hidden p-2 rounded-lg text-surface-600 hover:bg-surface-100"
              onClick={() => setMenuOpen(!menuOpen)} aria-label="Открыть меню" aria-expanded={menuOpen}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen
                  ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                  : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
                }
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <nav className="md:hidden pb-4 space-y-1" aria-label="Мобильная навигация">
              {navLinks.map(({ to, label }) => (
                <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'}`
                  }>
                  {label}
                </NavLink>
              ))}
              {isAuth ? (
                <>
                  <NavLink to="/cabinet" onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-surface-600 hover:bg-surface-100">
                    Кабинет
                  </NavLink>
                  <button onClick={() => { handleLogout(); setMenuOpen(false) }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-surface-600 hover:bg-surface-100">
                    Выйти
                  </button>
                </>
              ) : (
                <NavLink to="/auth" onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium bg-primary-600 text-white text-center rounded-xl">
                  Войти
                </NavLink>
              )}
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1 animate-fade-in">
        <Outlet />
      </main>

      <footer className="border-t border-surface-200 bg-white mt-auto">
        <div className="page-container py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary-600 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-surface-900">A11y Platform</span>
            </div>
            <p className="text-xs text-surface-400">
              Инструмент для создания доступных интерфейсов · WCAG 2.1
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}