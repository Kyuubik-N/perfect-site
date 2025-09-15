import React from 'react'
import { api } from '@/lib/api'
import { toast } from '@/components/toast/Toaster.jsx'
import TagInput from '@/components/TagInput.jsx'
import EmptyState from '@/components/EmptyState.jsx'

function fmt(d) {
  return d.toISOString().slice(0, 10)
}
function addMonths(date, m) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + m)
  return d
}
function startOfMonth(date) {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}
function endOfMonth(date) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + 1, 0)
  d.setHours(23, 59, 59, 999)
  return d
}
function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const delta = (day + 6) % 7
  d.setDate(d.getDate() - delta)
  d.setHours(0, 0, 0, 0)
  return d
}
function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export default function CalendarPage() {
  const today = new Date()
  const [cursor, setCursor] = React.useState(startOfMonth(today))
  const [events, setEvents] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [view, setView] = React.useState(() => localStorage.getItem('calView') || 'month')
  const [allTags, setAllTags] = React.useState([])
  const [selTags, setSelTags] = React.useState([])
  const [form, setForm] = React.useState({
    title: '',
    date: fmt(today),
    timeStart: '',
    timeEnd: '',
    description: '',
    tags: [],
  })

  const monthStart = startOfMonth(cursor)
  const gridStart = startOfWeek(monthStart)
  const grid = React.useMemo(
    () => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)),
    [gridStart],
  )

  React.useEffect(() => {
    localStorage.setItem('calView', view)
  }, [view])

  async function load() {
    setLoading(true)
    try {
      const from = fmt(gridStart)
      const to = fmt(addDays(gridStart, 41))
      const [rows, t] = await Promise.all([api.calendar.list(from, to), api.tags.list()])
      setEvents(rows)
      setAllTags(t.tags || [])
    } catch (e) {
      if (e.status === 401) toast.error('Нужен вход')
      else toast.error('Ошибка загрузки календаря')
    } finally {
      setLoading(false)
    }
  }
  React.useEffect(() => {
    load()
  }, [cursor])

  const filtered = React.useMemo(() => {
    if (!selTags.length) return events
    return events.filter((ev) => {
      const tags = String(ev.tags || '')
        .split(',')
        .filter(Boolean)
      return selTags.every((t) => tags.includes(t))
    })
  }, [events, selTags])

  const byDate = React.useMemo(() => {
    const map = new Map()
    for (const ev of filtered) {
      const k = ev.date
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(ev)
    }
    for (const arr of map.values())
      arr.sort((a, b) => ((a.timeStart || '') < (b.timeStart || '') ? -1 : 1))
    return map
  }, [filtered])

  async function addEvent(e) {
    e.preventDefault()
    const payload = {
      title: form.title.trim(),
      date: form.date,
      timeStart: form.timeStart || null,
      timeEnd: form.timeEnd || null,
      description: form.description || null,
      tags: form.tags,
    }
    if (!payload.title) return toast.error('Название обязательно')
    try {
      const created = await api.calendar.create(payload)
      setEvents((x) => [...x, created])
      setForm({
        title: '',
        date: fmt(today),
        timeStart: '',
        timeEnd: '',
        description: '',
        tags: [],
      })
      toast.success('Событие добавлено')
    } catch {
      toast.error('Не удалось добавить событие')
    }
  }

  async function removeEvent(id) {
    const keep = events
    setEvents((x) => x.filter((e) => e.id !== id))
    try {
      await api.calendar.remove(id)
      toast.success('Удалено')
    } catch {
      setEvents(keep)
      toast.error('Ошибка удаления')
    }
  }

  function quickAdd(dateStr) {
    const title = prompt(`Событие на ${dateStr}:`)
    if (!title) return
    api.calendar
      .create({ title, date: dateStr, tags: [] })
      .then((created) => setEvents((x) => [...x, created]))
      .catch(() => toast.error('Не удалось добавить'))
  }

  function downloadIcsCurrentMonth() {
    const from = fmt(startOfMonth(cursor))
    const to = fmt(endOfMonth(cursor))
    const url = api.calendar.icsUrl(from, to)
    const a = document.createElement('a')
    a.href = url
    a.download = 'calendar.ics'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
  function downloadIcsAll() {
    const url = api.calendar.icsUrl() // весь календарь
    const a = document.createElement('a')
    a.href = url
    a.download = 'calendar.ics'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const monthLabel = cursor.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })

  return (
    <div className="container-wide px-6 py-10" id="main">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-semibold">Календарь</h1>
        <div className="flex items-center gap-2">
          <div className="segmented">
            <button aria-pressed={view === 'month'} onClick={() => setView('month')}>
              Месяц
            </button>
            <button aria-pressed={view === 'agenda'} onClick={() => setView('agenda')}>
              Повестка
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              className="btn btn-ghost"
              onClick={downloadIcsCurrentMonth}
              title="Скачать .ics за месяц"
            >
              .ics месяца
            </button>
            <button
              className="btn btn-ghost"
              onClick={downloadIcsAll}
              title="Скачать весь календарь в .ics"
            >
              .ics весь
            </button>
          </div>
        </div>
      </div>

      {/* Фильтр по тегам */}
      <div className="mt-4">
        <TagInput
          value={selTags}
          onChange={setSelTags}
          suggestions={allTags}
          placeholder="фильтр по тегам"
        />
      </div>

      {/* Навигация по месяцам */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" onClick={() => setCursor(addMonths(cursor, -1))}>
            ← Пред
          </button>
          <button className="btn btn-ghost" onClick={() => setCursor(new Date())}>
            Сегодня
          </button>
          <button className="btn btn-ghost" onClick={() => setCursor(addMonths(cursor, +1))}>
            След →
          </button>
        </div>
        <div className="text-lg font-medium capitalize">{monthLabel}</div>
      </div>

      {/* Месячный вид */}
      {view === 'month' && (
        <div className="mt-4">
          <div className="grid grid-cols-7 gap-2 text-sm opacity-80">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
              <div key={d} className="px-2">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {grid.map((d, i) => {
              const dateStr = fmt(d)
              const isOther = d.getMonth() !== cursor.getMonth()
              const isToday = fmt(d) === fmt(new Date())
              const cellEvents = byDate.get(dateStr) || []
              return (
                <div
                  key={i}
                  className={`card p-2 min-h-[110px] ${isOther ? 'opacity-60' : ''}`}
                  onDoubleClick={() => quickAdd(dateStr)}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`text-sm ${isToday ? 'chip' : ''}`}
                      style={{ padding: isToday ? '2px 8px' : '' }}
                    >
                      {d.getDate()}
                    </div>
                    <button
                      className="btn btn-ghost text-xs px-2 py-1"
                      onClick={() => quickAdd(dateStr)}
                      title="Быстро добавить"
                    >
                      +
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {cellEvents.length === 0 && <div className="text-xs opacity-50">—</div>}
                    {cellEvents.slice(0, 3).map((ev) => (
                      <div key={ev.id} className="flex items-center gap-2">
                        <span className="chip" data-variant="accent">
                          {ev.timeStart
                            ? `${ev.timeStart}${ev.timeEnd ? `–${ev.timeEnd}` : ''}`
                            : '•'}
                        </span>
                        <div className="text-xs truncate" title={ev.title}>
                          {ev.title}
                        </div>
                        <button
                          className="ml-auto text-xs opacity-60 hover:opacity-100"
                          onClick={() => removeEvent(ev.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {cellEvents.length > 3 && (
                      <div className="text-[12px] opacity-70">+ ещё {cellEvents.length - 3}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Повестка (список) */}
      {view === 'agenda' && (
        <div className="mt-6 grid gap-3">
          {loading ? (
            <>
              <div className="card p-6 skel h-16"></div>
              <div className="card p-6 skel h-16"></div>
            </>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Нет событий"
              subtitle="Добавь событие через форму ниже или двойным кликом по дню в месяце"
            />
          ) : (
            Object.entries(
              filtered.reduce((acc, ev) => {
                ;(acc[ev.date] ||= []).push(ev)
                return acc
              }, {}),
            )
              .sort(([a], [b]) => (a < b ? -1 : 1))
              .map(([date, arr]) => (
                <div key={date} className="card p-5">
                  <div className="text-sm opacity-75">{date}</div>
                  <div className="mt-2 space-y-2">
                    {arr
                      .sort((a, b) => ((a.timeStart || '') < (b.timeStart || '') ? -1 : 1))
                      .map((ev) => (
                        <div key={ev.id} className="flex items-center gap-2">
                          <span className="chip" data-variant="accent">
                            {ev.timeStart
                              ? `${ev.timeStart}${ev.timeEnd ? `–${ev.timeEnd}` : ''}`
                              : '•'}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium">{ev.title}</div>
                            {ev.description && (
                              <div className="text-sm opacity-75">{ev.description}</div>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {String(ev.tags || '')
                                .split(',')
                                .filter(Boolean)
                                .map((t) => (
                                  <span key={t} className="chip">
                                    #{t}
                                  </span>
                                ))}
                            </div>
                          </div>
                          <button className="btn btn-ghost" onClick={() => removeEvent(ev.id)}>
                            Удалить
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* Форма добавления */}
      <form onSubmit={addEvent} className="mt-8 grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <input
          className="input"
          placeholder="Название"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <input
          className="input"
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        />
        <input
          className="input"
          type="time"
          value={form.timeStart}
          onChange={(e) => setForm((f) => ({ ...f, timeStart: e.target.value }))}
        />
        <input
          className="input"
          type="time"
          value={form.timeEnd}
          onChange={(e) => setForm((f) => ({ ...f, timeEnd: e.target.value }))}
        />
        <button className="btn btn-primary">Добавить</button>
        <div className="md:col-span-5">
          <input
            className="input"
            placeholder="Описание (необязательно)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="md:col-span-5">
          <TagInput
            value={form.tags}
            onChange={(tags) => setForm((f) => ({ ...f, tags }))}
            suggestions={allTags}
            placeholder="теги события"
          />
        </div>
      </form>
    </div>
  )
}
