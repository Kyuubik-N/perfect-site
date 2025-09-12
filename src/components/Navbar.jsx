import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from './ui/Button'
import CommandK from './command/CommandK'
import ApiStatus from './ApiStatus'
import { useTranslation } from 'react-i18next'

export default function Navbar() {
  const { i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const normalizedPath = (p) => {
    const s = (p || '/').replace(/\/+$/, '')
    return s === '' ? '/' : s
  }
  const path = normalizedPath(location.pathname)
  const lastNonHomeRef = React.useRef('/catalog')

  // init last route from storage (safe)
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('last_non_home_path')
      if (saved && saved.startsWith('/')) lastNonHomeRef.current = saved
    } catch {}
  }, [])

  // track last non-home route (safe)
  React.useEffect(() => {
    if (location.pathname !== '/') {
      lastNonHomeRef.current = location.pathname
      try {
        localStorage.setItem('last_non_home_path', location.pathname)
      } catch {}
    }
  }, [location.pathname])

  const onToggleHome = () => {
    const to = path === '/' ? lastNonHomeRef.current || '/notes' : '/'
    setTimeout(() => navigate(to), 0)
  }
  const onToggleCatalog = () => {
    const to = path === '/catalog' ? '/' : '/catalog'
    setTimeout(() => navigate(to), 0)
  }

  function ThemeToggle() {
    const [dark, setDark] = React.useState(() =>
      document.documentElement.classList.contains('dark'),
    )
    const toggle = () => {
      const next = !dark
      setDark(next)
      if (next) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
    }
    return (
      <button
        onClick={toggle}
        className="glass-button glass-button--icon focus-ring"
        aria-label="Переключить тему"
        title={dark ? 'Тёмная тема' : 'Светлая тема'}
      >
        {dark ? '🌙' : '☀️'}
      </button>
    )
  }

  function LanguageSwitcher() {
    const active = i18n.language?.startsWith('ru') ? 'ru' : 'en'
    const change = (lng) => i18n.changeLanguage(lng)
    return (
      <div
        className="hidden sm:inline-flex items-center gap-1 glass px-1 py-1 rounded-xl"
        role="group"
        aria-label="Выбор языка"
      >
        {['ru', 'en'].map((lng) => (
          <button
            key={lng}
            onClick={() => change(lng)}
            className={`glass-button text-xs ${active === lng ? 'glass-toggle-active bg-white/10' : ''}`}
            aria-pressed={active === lng}
            title={lng.toUpperCase()}
          >
            {lng.toUpperCase()}
          </button>
        ))}
      </div>
    )
  }
  return (
    <nav className="fixed top-0 inset-x-0 z-50 mx-auto container-wide mt-3 glass px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-accent-600/30 grid place-items-center text-accent-100 font-bold">
            K
          </div>
          <span className="heading text-lg gradient-text">Kyuubik</span>
        </div>
        <ul className="hidden sm:flex items-center gap-6 text-white/85">
          <li>
            <button
              type="button"
              onClick={onToggleHome}
              className={`rounded-md px-1 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70 ${path === '/' ? 'text-white' : ''}`}
              title={path === '/' ? 'Открыть последнюю страницу' : 'Вернуться на главную'}
            >
              Главная
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={onToggleCatalog}
              className={`rounded-md px-1 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70 ${path === '/catalog' ? 'text-white' : ''}`}
              title={path === '/catalog' ? 'Закрыть каталог' : 'Открыть каталог'}
            >
              Каталог
            </button>
          </li>
        </ul>
        <div className="flex items-center gap-2">
          <ApiStatus />
          <CommandK />
          <LanguageSwitcher />
          <ThemeToggle />
          {user ? (
            <>
              <span className="hidden sm:inline text-white/80">{user.username}</span>
              <Button onClick={logout}>Выйти</Button>
            </>
          ) : (
            <>
              <Button as="a" href="/login" className="btn-ghost">
                Войти
              </Button>
              <Button as="a" href="/register">
                Регистрация
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
