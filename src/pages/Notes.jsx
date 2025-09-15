import React from 'react'
import { api } from '@/lib/api'
import { toast } from '@/components/toast/Toaster.jsx'
import { useLocation, useNavigate } from 'react-router-dom'
import TagInput from '@/components/TagInput.jsx'
import Skeleton from '@/components/Skeleton.jsx'
import EmptyState from '@/components/EmptyState.jsx'

export default function NotesPage() {
  const [items, setItems] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [form, setForm] = React.useState({ name: '', date: '', url: '', tags: [] })
  const [allTags, setAllTags] = React.useState([])
  const [selTags, setSelTags] = React.useState([])
  const [view, setView] = React.useState(() => localStorage.getItem('notesView') || 'list')

  const location = useLocation()
  const navigate = useNavigate()

  const params = React.useMemo(() => new URLSearchParams(location.search), [location.search])
  const q = React.useMemo(() => params.get('q')?.toLowerCase().trim() || '', [params])
  const from = params.get('from') || ''
  const to = params.get('to') || ''
  const tagParams = React.useMemo(() => params.getAll('tag').map((t) => t.toLowerCase()), [params])

  React.useEffect(() => {
    let ignore = false
    Promise.all([api.notes.list(), api.tags.list()])
      .then(([rows, t]) => {
        if (ignore) return
        setItems(rows)
        setAllTags(t.tags || [])
        setSelTags(tagParams)
      })
      .catch((e) => {
        if (e.status === 401) toast.error('Нужен вход')
        else toast.error('Ошибка загрузки заметок')
      })
      .finally(() => !ignore && setLoading(false))
    return () => (ignore = true)
  }, [tagParams])

  React.useEffect(() => {
    localStorage.setItem('notesView', view)
  }, [view])

  const filtered = React.useMemo(() => {
    return items.filter((n) => {
      if (
        q &&
        !((n.name || '').toLowerCase().includes(q) || (n.url || '').toLowerCase().includes(q))
      )
        return false
      if (from && (n.date || '') < from) return false
      if (to && (n.date || '') > to) return false
      if (selTags.length) {
        const tags = String(n.tags || '')
          .split(',')
          .filter(Boolean)
        if (!selTags.every((t) => tags.includes(t))) return false
      }
      return true
    })
  }, [items, q, from, to, selTags])

  function updateQuery(next) {
    const p = new URLSearchParams(location.search)
    Object.entries(next).forEach(([k, v]) => {
      if (k === 'tag') {
        p.delete('tag')
        for (const t of v || []) p.append('tag', t)
      } else if (v) p.set(k, v)
      else p.delete(k)
    })
    navigate(`/notes?${p.toString()}`, { replace: true })
  }

  async function addNote(e) {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      date: form.date || null,
      url: form.url || null,
      tags: form.tags,
    }
    if (!payload.name) return toast.error('Введите название')
    const optimistic = { id: -Date.now(), ...payload }
    setItems((x) => [optimistic, ...x])
    setForm({ name: '', date: '', url: '', tags: [] })
    try {
      const created = await api.notes.create(payload)
      setItems((x) => x.map((it) => (it.id === optimistic.id ? created : it)))
      toast.success('Заметка добавлена')
    } catch (e) {
      setItems((x) => x.filter((it) => it.id !== optimistic.id))
      toast.error('Не удалось добавить')
    }
  }

  async function removeNote(id) {
    const keep = items
    setItems((x) => x.filter((i) => i.id !== id))
    try {
      await api.notes.remove(id)
      toast.success('Удалено')
    } catch {
      setItems(keep)
      toast.error('Ошибка удаления')
    }
  }

  return (
    <div className="container-wide px-6 py-10" id="main">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <h1 className="text-2xl font-semibold">
          Заметки {q && <span className="text-fg/60 text-base">· поиск: “{q}”</span>}
        </h1>
        <div className="flex items-center gap-2">
          <div className="segmented">
            <button aria-pressed={view === 'list'} onClick={() => setView('list')}>
              Список
            </button>
            <button aria-pressed={view === 'grid'} onClick={() => setView('grid')}>
              Плитка
            </button>
          </div>
        </div>
      </div>

      {/* Панель фильтров */}
      <div className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <TagInput
          value={selTags}
          onChange={(tags) => {
            setSelTags(tags)
            updateQuery({ tag: tags })
          }}
          suggestions={allTags}
          placeholder="фильтр по тегам"
        />
        <input
          className="input"
          type="date"
          value={from}
          onChange={(e) => updateQuery({ from: e.target.value })}
        />
        <input
          className="input"
          type="date"
          value={to}
          onChange={(e) => updateQuery({ to: e.target.value })}
        />
      </div>

      {/* Добавление */}
      <form onSubmit={addNote} className="mt-6 grid gap-3 sm:grid-cols-[2fr_1fr_2fr_auto]">
        <input
          className="input"
          placeholder="Название"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <input
          className="input"
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        />
        <input
          className="input"
          placeholder="Ссылка (необязательно)"
          value={form.url}
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
        />
        <button className="btn btn-primary">Добавить</button>
        <div className="sm:col-span-4">
          <TagInput
            value={form.tags}
            onChange={(tags) => setForm((f) => ({ ...f, tags }))}
            suggestions={allTags}
            placeholder="теги новой заметки"
          />
        </div>
      </form>

      {/* Список / Плитка */}
      <div className="mt-8 grid gap-3">
        {loading && (
          <>
            <Skeleton lines={2} />
            <Skeleton lines={3} />
            <Skeleton lines={1} />
          </>
        )}

        {!loading && filtered.length === 0 && (
          <EmptyState
            title="Ничего не найдено"
            subtitle="Сними фильтры или добавь первую заметку"
            action={
              <a href="#main" className="btn btn-primary">
                Добавить заметку
              </a>
            }
          />
        )}

        {!loading &&
          filtered.length > 0 &&
          view === 'list' &&
          filtered.map((n) => (
            <div key={n.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <div className="font-medium">{n.name}</div>
                <div className="text-sm text-fg/70">
                  {n.date ? n.date : '—'}
                  {n.url ? (
                    <>
                      {' '}
                      ·{' '}
                      <a href={n.url} target="_blank" rel="noreferrer" className="underline">
                        ссылка
                      </a>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {String(n.tags || '')
                  .split(',')
                  .filter(Boolean)
                  .map((t) => (
                    <span key={t} className="chip" data-variant="accent">
                      #{t}
                    </span>
                  ))}
              </div>
              <button onClick={() => removeNote(n.id)} className="btn btn-ghost">
                Удалить
              </button>
            </div>
          ))}

        {!loading && filtered.length > 0 && view === 'grid' && (
          <div className="grid-cards">
            {filtered.map((n) => (
              <div key={n.id} className="card p-5 flex flex-col gap-3">
                <div className="text-base font-medium">{n.name}</div>
                <div className="text-sm text-fg/70">
                  {n.date ? n.date : '—'}{' '}
                  {n.url && (
                    <>
                      ·{' '}
                      <a className="underline" href={n.url} target="_blank" rel="noreferrer">
                        ссылка
                      </a>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-auto">
                  {String(n.tags || '')
                    .split(',')
                    .filter(Boolean)
                    .map((t) => (
                      <span key={t} className="chip" data-variant="accent">
                        #{t}
                      </span>
                    ))}
                </div>
                <div className="flex justify-end">
                  <button onClick={() => removeNote(n.id)} className="btn btn-ghost">
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
