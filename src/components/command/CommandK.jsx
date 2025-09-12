import React from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'

function useHotkey(toggle) {
  React.useEffect(() => {
    const onKey = (e) => {
      const metaK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (metaK) {
        e.preventDefault()
        toggle()
      }
      if (e.key === 'Escape') toggle(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])
}

const actions = [
  { id: 'home', label: 'Главная', to: '/' },
  { id: 'notes', label: 'Заметки', to: '/notes' },
  { id: 'calendar', label: 'Календарь', to: '/calendar' },
  { id: 'catalog', label: 'Каталог', to: '/catalog' },
  { id: 'files', label: 'Файлы', to: '/files' },
  { id: 'library', label: 'Библиотека', to: '/library' },
  { id: 'settings', label: 'Настройки', to: '/settings' },
]

export default function CommandK({ hideButton = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState('')
  const [index, setIndex] = React.useState(0)
  const inputRef = React.useRef(null)
  const lastActive = React.useRef(null)

  const toggle = (v) => setOpen((prev) => (typeof v === 'boolean' ? v : !prev))
  useHotkey(toggle)

  React.useEffect(() => {
    if (open) setOpen(false)
  }, [location.pathname])

  React.useEffect(() => {
    if (open) {
      lastActive.current = document.activeElement
      document.body.classList.add('overflow-hidden')
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      document.body.classList.remove('overflow-hidden')
      if (lastActive.current && lastActive.current.focus) lastActive.current.focus()
      setQ('')
      setIndex(0)
    }
  }, [open])

  const items = React.useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return actions
    return actions.filter((a) => a.label.toLowerCase().includes(s))
  }, [q])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(items.length - 1, i + 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(0, i - 1))
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const it = items[index]
      if (it?.to) navigate(it.to)
      setOpen(false)
    }
  }

  return (
    <>
      {!hideButton && (
        <button
          type="button"
          className="glass-button glass-button--icon focus-ring"
          onClick={() => toggle(true)}
          title="Командная палитра (Ctrl/Cmd + K)"
          aria-label="Командная палитра"
        >
          ⌘K
        </button>
      )}

      {open &&
        createPortal(
          <div
            className="k-overlay"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpen(false)
            }}
          >
            <div className="k-panel glass" onKeyDown={onKeyDown}>
              <div className="k-search">
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Что сделать? (нажмите Esc для выхода)"
                  className="k-input"
                  aria-label="Поиск команды"
                />
              </div>
              <div className="k-list" role="listbox">
                {items.length === 0 && <div className="k-empty">Ничего не найдено</div>}
                {items.map((it, i) => (
                  <button
                    key={it.id}
                    role="option"
                    aria-selected={i === index}
                    className={`k-item ${i === index ? 'active' : ''}`}
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => {
                      if (it.to) navigate(it.to)
                      setOpen(false)
                    }}
                  >
                    <span className="k-item-label">{it.label}</span>
                    <span className="k-item-hint">{i === index ? 'Enter' : ''}</span>
                  </button>
                ))}
              </div>
              <div className="k-hint">
                Подсказка: нажмите <b>Ctrl/Cmd + K</b>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
