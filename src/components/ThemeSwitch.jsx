import React from 'react'

function applyTheme(theme) {
  try {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    } else if (theme === 'dark') {
      root.classList.remove('light')
      root.classList.add('dark')
    } else {
      // system
      root.classList.remove('light')
      const m = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', m)
    }
    localStorage.setItem('theme', theme)
  } catch {}
}

export default function ThemeSwitch({ className = '' }) {
  const [mode, setMode] = React.useState(() => localStorage.getItem('theme') || 'system')

  React.useEffect(() => {
    applyTheme(mode)
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if ((localStorage.getItem('theme') || 'system') === 'system') applyTheme('system')
    }
    mql.addEventListener?.('change', onChange)
    return () => mql.removeEventListener?.('change', onChange)
  }, [mode])

  function next() {
    setMode((m) => (m === 'dark' ? 'light' : m === 'light' ? 'system' : 'dark'))
  }

  const label = mode === 'system' ? 'Система' : mode === 'dark' ? 'Тёмная' : 'Светлая'

  return (
    <button
      className={`btn btn-ghost text-sm ${className}`}
      onClick={next}
      title={`Тема: ${label}`}
    >
      {mode === 'dark' && <span aria-hidden>🌙</span>}
      {mode === 'light' && <span aria-hidden>☀️</span>}
      {mode === 'system' && <span aria-hidden>🖥️</span>}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
