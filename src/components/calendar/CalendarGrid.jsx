import React, { useMemo, useRef, useEffect } from 'react'

// Формирует матрицу дней для месяца (понедельник — первый)
function buildMatrix(year, month) {
  // month: 0-11
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7 // Mon=0..Sun=6
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()

  const cells = []
  for (let i = 0; i < 42; i++) {
    const dayNum = i < startOffset ? prevDays - startOffset + 1 + i : i - startOffset + 1
    const inMonth = i >= startOffset && dayNum <= daysInMonth
    const d = new Date(year, month + (inMonth ? 0 : i < startOffset ? -1 : 1), dayNum)
    const iso = d.toISOString().slice(0, 10)
    cells.push({ date: d, iso, inMonth })
  }
  return cells
}

export default function CalendarGrid({
  value, // Date | null — выбранный день
  onChange, // (Date) => void
  countersByDate = {}, // { 'YYYY-MM-DD': {notes:number, files:number} }
  year,
  month,
  setYear,
  setMonth,
  compact = false,
  mode = 'month', // 'month' | 'week'
}) {
  const cells = useMemo(() => {
    if (mode === 'week') {
      const base = value || new Date(year, month, 1)
      const d = new Date(base)
      const dow = (d.getDay() + 6) % 7 // Mon=0
      d.setDate(d.getDate() - dow)
      const list = []
      for (let i = 0; i < 7; i++) {
        const cur = new Date(d)
        cur.setDate(d.getDate() + i)
        const iso = cur.toISOString().slice(0, 10)
        list.push({ date: cur, iso, inMonth: cur.getMonth() === month })
      }
      return list
    }
    return buildMatrix(year, month)
  }, [year, month, mode, value])
  const todayISO = new Date().toISOString().slice(0, 10)
  const selectedISO = value ? value.toISOString().slice(0, 10) : null

  // клавиатура: ← → ↑ ↓, Home/End, PgUp/PgDn, T(oday)
  const gridRef = useRef(null)
  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    function onKey(e) {
      const cellsArr = Array.from(el.querySelectorAll('[role="gridcell"]'))
      const focus = el.querySelector('[tabindex="0"]')
      const idx = cellsArr.indexOf(focus)
      const move = (delta) => {
        const next = cellsArr[idx + delta]
        if (next) {
          next.focus()
          next.click()
        }
      }
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          move(-1)
          break
        case 'ArrowRight':
          e.preventDefault()
          move(1)
          break
        case 'ArrowUp':
          e.preventDefault()
          move(-7)
          break
        case 'ArrowDown':
          e.preventDefault()
          move(7)
          break
        case 'Home':
          e.preventDefault()
          setMonth((m) => (m + 11) % 12)
          setYear((y) => y - (month === 0 ? 1 : 0))
          break
        case 'End':
          e.preventDefault()
          setMonth((m) => (m + 1) % 12)
          setYear((y) => y + (month === 11 ? 1 : 0))
          break
        case 'PageUp':
          e.preventDefault()
          setMonth((m) => (m + 11) % 12)
          if (month === 0) setYear((y) => y - 1)
          break
        case 'PageDown':
          e.preventDefault()
          setMonth((m) => (m + 1) % 12)
          if (month === 11) setYear((y) => y + 1)
          break
        case 't':
        case 'T':
          {
            e.preventDefault()
            const t = new Date()
            onChange?.(t)
            setYear(t.getFullYear())
            setMonth(t.getMonth())
          }
          break
        default:
          break
      }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [month, setMonth, setYear, onChange])

  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  const isWeek = mode === 'week'
  const rowClass = isWeek
    ? compact
      ? 'auto-rows-[minmax(80px,1fr)]'
      : 'auto-rows-[minmax(120px,1fr)]'
    : compact
      ? 'auto-rows-[minmax(56px,1fr)]'
      : 'auto-rows-[minmax(88px,1fr)]'
  const gapClass = compact ? 'gap-1' : 'gap-2 sm:gap-3'
  const dayNumClass = compact
    ? 'text-xs sm:text-sm font-medium'
    : 'text-sm sm:text-base font-medium'
  const paddingClass = compact ? 'p-1.5' : 'p-2 sm:p-3'

  return (
    <div className="space-y-3">
      {/* Подписи дней недели */}
      <div
        className={`grid grid-cols-7 text-center ${compact ? 'text-[11px]' : 'text-xs sm:text-sm'} text-white/60`}
      >
        {weekdays.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Сетка 6x7 */}
      <div
        ref={gridRef}
        role="grid"
        aria-label="Календарь"
        className={`grid grid-cols-7 ${rowClass} ${gapClass}`}
      >
        {cells.map(({ date, iso, inMonth }, i) => {
          const isToday = iso === todayISO
          const isSelected = iso === selectedISO
          const c = countersByDate[iso] || {}
          const hasSomething = (c.notes || 0) + (c.files || 0) > 0

          return (
            <button
              key={iso + '-' + i}
              role="gridcell"
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onChange?.(date)}
              aria-selected={isSelected}
              className={[
                'group relative rounded-xl text-left transition focus-ring',
                paddingClass,
                'bg-white/[.04] hover:bg-white/[.06]',
                'border border-white/10 hover:border-white/15',
                !inMonth && 'opacity-50',
                isSelected && 'ring-2 ring-accent-400/70 border-transparent',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* номер дня */}
              <div className="flex items-start justify-between">
                <span className={dayNumClass}>{date.getDate()}</span>
                {isToday &&
                  (!compact ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs bg-accent-600/30 text-accent-100">
                      Сегодня
                    </span>
                  ) : (
                    <span
                      className="mt-0.5 mr-0.5 inline-block size-2 rounded-full bg-accent-400/80"
                      aria-label="Сегодня"
                    />
                  ))}
              </div>

              {/* бейджи содержимого */}
              {hasSomething && (
                <div
                  className={`absolute ${compact ? 'bottom-1 left-1' : 'bottom-2 left-2'} flex ${compact ? 'gap-0.5' : 'gap-1'}`}
                >
                  {c.notes > 0 && (
                    <span
                      className={`${compact ? 'px-1 text-[9px]' : 'px-1.5 text-[10px]'} py-0.5 rounded-md bg-emerald-400/20 text-emerald-100`}
                    >
                      {c.notes}📝
                    </span>
                  )}
                  {c.files > 0 && (
                    <span
                      className={`${compact ? 'px-1 text-[9px]' : 'px-1.5 text-[10px]'} py-0.5 rounded-md bg-sky-400/20 text-sky-100`}
                    >
                      {c.files}📁
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
