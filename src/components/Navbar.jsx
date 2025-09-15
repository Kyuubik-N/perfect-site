import React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext.jsx'
import ThemeSwitch from '@/components/ThemeSwitch.jsx'
import SearchBar from '@/components/SearchBar.jsx'

function ActiveLink({ to, children }) {
  return (
    <NavLink to={to} className={({ isActive }) => `navlink ${isActive ? 'is-active' : ''}`}>
      {children}
    </NavLink>
  )
}

// ripple coords
function useRipplePointer() {
  React.useEffect(() => {
    const handler = (e) => {
      const btn = e.target.closest?.('.btn')
      if (!btn) return
      const r = btn.getBoundingClientRect()
      btn.style.setProperty('--x', `${e.clientX - r.left}px`)
      btn.style.setProperty('--y', `${e.clientY - r.top}px`)
    }
    window.addEventListener('pointerdown', handler, { capture: true })
    return () => window.removeEventListener('pointerdown', handler, { capture: true })
  }, [])
}

export default function Navbar() {
  useRipplePointer()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function onLogout() {
    try {
      await logout()
      navigate('/login')
    } catch {}
  }

  return (
    <header className="navbar sticky top-0 z-40">
      <div className="container-wide px-4 sm:px-6 h-16 flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <NavLink to="/" className="text-lg font-semibold tracking-wide gradient-text">
            Kyuubik
          </NavLink>
          <nav className="hidden md:flex items-center gap-2">
            <ActiveLink to="/notes">Заметки</ActiveLink>
            <ActiveLink to="/files">Файлы</ActiveLink>
            <ActiveLink to="/calendar">Календарь</ActiveLink>
            <ActiveLink to="/library">Библиотека</ActiveLink>
            <ActiveLink to="/settings">Настройки</ActiveLink>
          </nav>
        </div>

        {/* Глобальный поиск */}
        <SearchBar />

        <div className="flex items-center gap-2">
          <ThemeSwitch className="hidden sm:inline-flex" />
          {user ? (
            <>
              <span className="hidden lg:inline text-sm opacity-80">
                Привет, <b>{user.username}</b>
              </span>
              <button className="btn btn-ghost" onClick={onLogout}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <ActiveLink to="/login">Войти</ActiveLink>
              <NavLink to="/register" className="btn btn-primary">
                Регистрация
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
