import { useEffect, useMemo, useState } from 'react'
import Protected from '../components/Protected'
import CalendarGrid from '../components/calendar/CalendarGrid'
import GlassCard from '../components/GlassCard'
import { api } from '../lib/api'

function ymd(d) {
  return d.toISOString().slice(0, 10)
}

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-11
  const [selected, setSelected] = useState(now)
  const [notes, setNotes] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [compact, setCompact] = useState(() => {
    try {
      return localStorage.getItem('calendar_compact') === '1'
    } catch {
      return false
    }
  })
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem('calendar_mode') === 'week' ? 'week' : 'month'
    } catch {
      return 'month'
    }
  })

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const [n, f] = await Promise.all([api('/api/notes'), api('/api/files')])
        if (!active) return
        setNotes(n.map((r) => ({ id: r.id, date: r.date, title: r.title, content: r.text })))
        setFiles(f.map((r) => ({ id: r.id, date: r.date, name: r.name, url: r.url })))
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const countersByDate = useMemo(() => {
    const map = {}
    for (const n of notes) {
      const d = n.date
      if (!map[d]) map[d] = { notes: 0, files: 0 }
      map[d].notes++
    }
    for (const f of files) {
      const d = f.date
      if (!map[d]) map[d] = { notes: 0, files: 0 }
      map[d].files++
    }
    return map
  }, [notes, files])

  const day = ymd(selected)
  const notesForDay = useMemo(() => notes.filter((n) => n.date === day), [notes, day])
  const filesForDay = useMemo(() => files.filter((f) => f.date === day), [files, day])

  const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(
    new Date(year, month, 1),
  )

  function goPrev() {
    if (mode === 'week') {
      const t = new Date(selected)
      t.setDate(t.getDate() - 7)
      setSelected(t)
      setYear(t.getFullYear())
      setMonth(t.getMonth())
    } else {
      setMonth((m) => {
        if (m === 0) {
          setYear((y) => y - 1)
          return 11
        }
        return m - 1
      })
    }
  }
  function goNext() {
    if (mode === 'week') {
      const t = new Date(selected)
      t.setDate(t.getDate() + 7)
      setSelected(t)
      setYear(t.getFullYear())
      setMonth(t.getMonth())
    } else {
      setMonth((m) => {
        if (m === 11) {
          setYear((y) => y + 1)
          return 0
        }
        return m + 1
      })
    }
  }

  return (
    <Protected>
      <div className="mx-auto max-w-6xl px-4 pt-28 pb-20 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="heading text-2xl sm:text-3xl text-glow">Календарь</h2>
          <div className="flex items-center gap-2">
            {/* Навигация */}
            <div className="flex items-center gap-1 glass px-2 py-1 rounded-xl">
              <button
                aria-label={mode === 'week' ? 'Предыдущая неделя' : 'Предыдущий месяц'}
                className="glass-button glass-button--icon focus-ring"
                onClick={goPrev}
              >
                ←
              </button>
              <div className="px-3 py-1.5 rounded-lg text-sm capitalize text-white/90">
                {monthName} {year} г.
              </div>
              <button
                aria-label={mode === 'week' ? 'Следующая неделя' : 'Следующий месяц'}
                className="glass-button glass-button--icon focus-ring"
                onClick={goNext}
              >
                →
              </button>
            </div>

            {/* Действия */}
            <div className="flex items-center gap-1">
              <button
                className="glass-button focus-ring"
                onClick={() => {
                  const t = new Date()
                  setYear(t.getFullYear())
                  setMonth(t.getMonth())
                  setSelected(t)
                }}
              >
                <span className="hidden sm:inline">Сегодня</span>
                <span className="sm:hidden">Т</span>
              </button>
              <button
                className={`glass-button focus-ring ${compact ? 'glass-toggle-active bg-white/10' : ''}`}
                aria-pressed={compact}
                title={compact ? 'Отключить компактный вид' : 'Включить компактный вид'}
                onClick={() => {
                  setCompact((v) => {
                    const next = !v
                    try {
                      localStorage.setItem('calendar_compact', next ? '1' : '0')
                    } catch {}
                    return next
                  })
                }}
              >
                <span className="hidden sm:inline">Компактно</span>
                <span
                  className={`inline-block size-2 rounded-full ${compact ? 'bg-emerald-400' : 'bg-white/40'}`}
                  aria-hidden
                />
              </button>
              <button
                className={`glass-button focus-ring ${mode === 'week' ? 'glass-toggle-active bg-white/10' : ''}`}
                aria-pressed={mode === 'week'}
                title={mode === 'week' ? 'Показать месяц' : 'Показать неделю'}
                onClick={() => {
                  setMode((m) => {
                    const next = m === 'week' ? 'month' : 'week'
                    try {
                      localStorage.setItem('calendar_mode', next)
                    } catch {}
                    return next
                  })
                }}
              >
                <span className="hidden sm:inline">Неделя</span>
                <span className="sm:hidden">7д</span>
              </button>
            </div>
          </div>
        </div>

        <CalendarGrid
          year={year}
          month={month}
          setYear={setYear}
          setMonth={setMonth}
          value={selected}
          onChange={setSelected}
          countersByDate={countersByDate}
          compact={compact}
          mode={mode}
        />

        {/* Панели выбранного дня */}
        <div className="grid md:grid-cols-2 gap-4">
          <GlassCard>
            <div className="text-sm text-white/60 mb-2">Заметки на {day}</div>
            {loading && <div className="text-white/60">Загрузка…</div>}
            {!loading && notesForDay.length === 0 && (
              <div className="text-white/50">Нет заметок</div>
            )}
            {!loading &&
              notesForDay.map((n) => (
                <div key={n.id} className="mt-2">
                  <div className="font-medium text-white/90">{n.title}</div>
                  {n.content && (
                    <div className="text-white/70 whitespace-pre-wrap">{n.content}</div>
                  )}
                </div>
              ))}
          </GlassCard>
          <GlassCard>
            <div className="text-sm text-white/60 mb-2">Файлы на {day}</div>
            {loading && <div className="text-white/60">Загрузка…</div>}
            {!loading && filesForDay.length === 0 && (
              <div className="text-white/50">Нет файлов</div>
            )}
            {!loading &&
              filesForDay.map((f) => (
                <div key={f.id} className="mt-2">
                  <div className="text-white/80 truncate">{f.name || f.url || 'Файл'}</div>
                  {f.url && (
                    <a
                      className="text-accent-200 underline break-all"
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Открыть
                    </a>
                  )}
                </div>
              ))}
          </GlassCard>
        </div>
      </div>
    </Protected>
  )
}
