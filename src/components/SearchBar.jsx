import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '@/lib/api'
import { toast } from '@/components/toast/Toaster.jsx'

export default function SearchBar() {
  const [q, setQ] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [res, setRes] = React.useState({ notes: [], files: [], events: [] })
  const [active, setActive] = React.useState({ group: 0, index: 0 }) // навигация стрелками
  const nav = useNavigate()
  const loc = useLocation()
  const boxRef = React.useRef(null)
  const inputRef = React.useRef(null)

  // Фокус по "/" (как раньше)
  React.useEffect(() => {
    const onKey = (e) => {
      if (
        e.key === '/' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Закрытие по клику вне
  React.useEffect(() => {
    const onDoc = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    return () => document.removeEventListener('pointerdown', onDoc)
  }, [])

  // Сброс при смене маршрута
  React.useEffect(() => {
    setOpen(false)
  }, [loc.pathname])

  // Дебаунс поиска
  React.useEffect(() => {
    if (!q || q.trim().length < 2) {
      setRes({ notes: [], files: [], events: [] })
      setOpen(!!q)
      return
    }
    const t = setTimeout(async () => {
      try {
        const data = await api.search(q.trim())
        setRes(data)
        setOpen(true)
      } catch (e) {
        if (e.status === 401) toast.error('Нужно войти')
      }
    }, 200)
    return () => clearTimeout(t)
  }, [q])

  const groups = [
    { key: 'notes', label: 'Заметки', items: res.notes || [] },
    { key: 'files', label: 'Файлы', items: res.files || [] },
    { key: 'events', label: 'События', items: res.events || [] },
  ].filter((g) => g.items.length)

  function move(delta) {
    if (!groups.length) return
    let g = active.group,
      i = active.index + delta
    while (true) {
      const len = groups[g].items.length
      if (i >= 0 && i < len) break
      if (i < 0) {
        g = (g - 1 + groups.length) % groups.length
        i = groups[g].items.length - 1
      } else {
        g = (g + 1) % groups.length
        i = 0
      }
    }
    setActive({ group: g, index: i })
  }

  function openSelected() {
    if (!groups.length) return onSubmit()
    const g = groups[active.group]
    const it = g.items[active.index]
    openItem(g.key, it)
  }

  function onSubmit(e) {
    e?.preventDefault()
    // По Enter без выбора — ищем по заметкам
    const query = q.trim()
    if (!query) return
    nav(`/notes?q=${encodeURIComponent(query)}`)
    setOpen(false)
  }

  function openItem(groupKey, it) {
    if (groupKey === 'files') {
      const url = String(it.url || '')
      if (!url) return
      if (/^https?:\/\//i.test(url) || url.startsWith('/u/')) {
        window.open(url, '_blank', 'noopener,noreferrer')
      } else {
        // относительные ссылки — открываем как есть
        window.open(url, '_blank', 'noopener,noreferrer')
      }
      setOpen(false)
      return
    }
    if (groupKey === 'notes') {
      const hint = it.name ? encodeURIComponent(it.name) : encodeURIComponent(q.trim())
      nav(`/notes?q=${hint}`)
      setOpen(false)
      return
    }
    if (groupKey === 'events') {
      // просто переходим в календарь (в будущем можно прокинуть дату через состояние)
      nav('/calendar')
      setOpen(false)
      return
    }
  }

  function Row({ children, active }) {
    return (
      <div
        className={`px-3 py-2 rounded-xl cursor-pointer ${active ? 'bg-white/12' : 'hover:bg-white/8'}`}
      >
        {children}
      </div>
    )
  }

  return (
    <div className="hidden sm:block relative w-full max-w-md" ref={boxRef}>
      <form onSubmit={onSubmit}>
        <input
          id="global-search"
          ref={inputRef}
          name="q"
          className="input pl-9"
          placeholder="Глобальный поиск ( / )"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              move(+1)
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              move(-1)
            }
            if (e.key === 'Enter') {
              e.preventDefault()
              openSelected()
            }
            if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
        />
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <circle cx="11" cy="11" r="7"></circle>
          <path d="m20 20-3.5-3.5" />
        </svg>
      </form>

      {open && (groups.length > 0 || q.trim().length >= 2) && (
        <div className="absolute z-50 mt-2 w-full card p-2 shadow-float">
          {groups.length === 0 ? (
            <div className="px-3 py-2 text-sm opacity-70">Ничего не найдено</div>
          ) : (
            groups.map((g, gi) => (
              <div key={g.key} className="mb-2 last:mb-0">
                <div className="px-3 py-1 text-xs uppercase opacity-60">{g.label}</div>
                <div className="space-y-1">
                  {g.items.slice(0, 5).map((it, ii) => {
                    const isActive = gi === active.group && ii === active.index
                    return (
                      <div
                        key={`${g.key}-${it.id}`}
                        onMouseEnter={() => setActive({ group: gi, index: ii })}
                        onClick={() => openItem(g.key, it)}
                      >
                        <Row active={isActive}>
                          {g.key === 'notes' && (
                            <div className="flex items-center gap-2">
                              <span className="chip" data-variant="accent">
                                📝
                              </span>
                              <div className="truncate">{it.name}</div>
                              {it.date && (
                                <div className="ml-auto text-xs opacity-70">{it.date}</div>
                              )}
                            </div>
                          )}
                          {g.key === 'files' && (
                            <div className="flex items-center gap-2">
                              <span className="chip" data-variant="accent">
                                📁
                              </span>
                              <div className="truncate">{it.name}</div>
                              <div className="ml-auto text-xs opacity-70">
                                {(it.url || '').replace(/^https?:\/\//, '')}
                              </div>
                            </div>
                          )}
                          {g.key === 'events' && (
                            <div className="flex items-center gap-2">
                              <span className="chip" data-variant="accent">
                                📅
                              </span>
                              <div className="truncate">{it.title}</div>
                              <div className="ml-auto text-xs opacity-70">
                                {it.date}
                                {it.timeStart ? ` ${it.timeStart}` : ''}
                              </div>
                            </div>
                          )}
                        </Row>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
          <div className="mt-1 px-3 pt-2 border-t border-white/10 text-xs flex justify-between">
            <div className="opacity-70">Enter — открыть/перейти · Esc — закрыть · ↑/↓ — выбор</div>
            <button
              className="hover:underline"
              onClick={() => {
                nav(`/notes?q=${encodeURIComponent(q.trim())}`)
                setOpen(false)
              }}
            >
              Искать в заметках →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
