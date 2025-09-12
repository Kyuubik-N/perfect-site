import React from 'react'
import { NavLink, useNavigate, useResolvedPath, useMatch } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from './ui/Button'
import CommandK from './command/CommandK'

function applyThemeMode(mode) {
  const root = document.documentElement
  if (mode === 'auto') {
    try {
      localStorage.removeItem('theme')
    } catch {}
    const dark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
    root.classList.toggle('dark', !!dark)
    root.setAttribute('data-theme', dark ? 'dark' : 'light')
  } else {
    root.classList.toggle('dark', mode === 'dark')
    root.setAttribute('data-theme', mode)
    try {
      localStorage.setItem('theme', mode)
    } catch {}
  }
}
function getInitialMode() {
  const saved = localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark') return saved
  return 'auto'
}

function ThemeModeSwitch() {
  const [mode, setMode] = React.useState(getInitialMode())
  React.useEffect(() => {
    applyThemeMode(mode)
  }, [mode])
  React.useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (mode === 'auto') applyThemeMode('auto')
    }
    mq?.addEventListener?.('change', onChange)
    return () => mq?.removeEventListener?.('change', onChange)
  }, [mode])

  const Btn = ({ val, title, children }) => (
    <button
      className={`seg-mini-btn ${mode === val ? 'is-active' : ''}`}
      onClick={() => setMode(val)}
      title={title}
      aria-pressed={mode === val}
      type="button"
    >
      {children}
    </button>
  )

  return (
    <div className="seg-mini" role="group" aria-label="Переключатель темы">
      <Btn val="auto" title="Авто (системная)">
        ⎋
      </Btn>
      <Btn val="light" title="Светлая">
        ☀️
      </Btn>
      <Btn val="dark" title="Тёмная">
        🌙
      </Btn>
    </div>
  )
}

/** Кнопка-таб: не триггерит переход, если уже активна */
function TabLink({ to, end, children }) {
  const resolved = useResolvedPath(to)
  const match = useMatch({ path: resolved.pathname, end: !!end })
  const onClick = (e) => {
    if (match) e.preventDefault()
  } // повторный клик — игнор
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      aria-current={match ? 'page' : undefined}
      className={({ isActive }) =>
        'navlink px-2 ' + (isActive ? 'is-active text-white' : 'text-fg')
      }
    >
      {children}
    </NavLink>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [hidden, setHidden] = React.useState(false)
  const lastY = React.useRef(0)

  React.useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0
      const down = y > lastY.current
      const delta = Math.abs(y - lastY.current)
      if (y < 12 || delta < 6) setHidden(false)
      else setHidden(down)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className="glass-nav fixed top-0 inset-x-0 z-[60] mx-auto container-wide mt-3 px-4 py-2 transition-all duration-300"
      data-hidden={hidden ? 'true' : 'false'}
    >
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-3"
          onClick={() => navigate('/')}
          aria-label="На главную"
          title="На главную"
        >
          <div className="size-8 rounded-xl bg-accent-soft grid place-items-center text-accent font-bold">
            K
          </div>
          <span className="heading text-lg gradient-text">Kyuubik</span>
        </button>

        <ul className="hidden sm:flex items-center gap-2">
          <li>
            <TabLink to="/" end>
              Главная
            </TabLink>
          </li>
          <li>
            <TabLink to="/catalog">Каталог</TabLink>
          </li>
          <li>
            <TabLink to="/notes">Заметки</TabLink>
          </li>
          <li>
            <TabLink to="/files">Файлы</TabLink>
          </li>
          <li>
            <TabLink to="/calendar">Календарь</TabLink>
          </li>
        </ul>

        <div className="flex items-center gap-2">
          <CommandK hideButton />
          <ThemeModeSwitch />
          <button
            className="glass-button glass-button--icon"
            onClick={() => navigate('/settings')}
            title="Настройки"
          >
            ⚙️
          </button>
          {user ? (
            <>
              <span className="hidden sm:inline text-fg/80">{user.username}</span>
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
