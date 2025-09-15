import React from 'react'
import { api } from '@/lib/api'
import { toast } from '@/components/toast/Toaster.jsx'
import { useLocation, useNavigate } from 'react-router-dom'
import TagInput from '@/components/TagInput.jsx'
import Skeleton from '@/components/Skeleton.jsx'
import EmptyState from '@/components/EmptyState.jsx'

export default function FilesPage() {
  const [items, setItems] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [form, setForm] = React.useState({ name: '', url: '', date: '', tags: [] })
  const [busy, setBusy] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [dragOver, setDragOver] = React.useState(false)
  const [allTags, setAllTags] = React.useState([])
  const [selTags, setSelTags] = React.useState([])
  const [view, setView] = React.useState(() => localStorage.getItem('filesView') || 'list')

  const location = useLocation()
  const navigate = useNavigate()
  const params = React.useMemo(() => new URLSearchParams(location.search), [location.search])
  const q = React.useMemo(() => params.get('q')?.toLowerCase().trim() || '', [params])
  const from = params.get('from') || ''
  const to = params.get('to') || ''
  const tagParams = React.useMemo(() => params.getAll('tag').map((t) => t.toLowerCase()), [params])

  React.useEffect(() => {
    let ignore = false
    Promise.all([api.files.list(), api.tags.list()])
      .then(([rows, t]) => {
        if (ignore) return
        setItems(rows)
        setAllTags(t.tags || [])
        setSelTags(tagParams)
      })
      .catch((e) => {
        if (e.status === 401) toast.error('Нужен вход')
        else toast.error('Ошибка загрузки файлов')
      })
      .finally(() => !ignore && setLoading(false))
    return () => (ignore = true)
  }, [tagParams])

  React.useEffect(() => {
    localStorage.setItem('filesView', view)
  }, [view])

  const filtered = React.useMemo(() => {
    return items.filter((f) => {
      if (
        q &&
        !((f.name || '').toLowerCase().includes(q) || (f.url || '').toLowerCase().includes(q))
      )
        return false
      if (from && (f.date || '') < from) return false
      if (to && (f.date || '') > to) return false
      if (selTags.length) {
        const tags = String(f.tags || '')
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
    navigate(`/files?${p.toString()}`, { replace: true })
  }

  async function addLink(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.url.trim()) return toast.error('Укажите имя и ссылку')
    const optimistic = {
      id: -Date.now(),
      name: form.name.trim(),
      url: form.url.trim(),
      date: form.date || null,
      tags: form.tags,
    }
    setItems((x) => [optimistic, ...x])
    setForm({ name: '', url: '', date: '', tags: [] })
    try {
      const created = await api.files.create(optimistic)
      setItems((x) => x.map((it) => (it.id === optimistic.id ? created : it)))
      toast.success('Ссылка добавлена')
    } catch {
      setItems((x) => x.filter((it) => it.id !== optimistic.id))
      toast.error('Не удалось добавить')
    }
  }

  async function removeItem(id) {
    const keep = items
    setItems((x) => x.filter((i) => i.id !== id))
    try {
      await api.files.remove(id)
      toast.success('Удалено')
    } catch {
      setItems(keep)
      toast.error('Ошибка удаления')
    }
  }

  async function saveItem(id, data) {
    const prev = items
    setItems((x) => x.map((it) => (it.id === id ? { ...it, ...data } : it)))
    try {
      await api.files.update(id, data)
      toast.success('Сохранено')
    } catch {
      setItems(prev)
      toast.error('Не удалось сохранить')
    }
  }

  async function doUpload(fileList) {
    const files = Array.from(fileList || [])
    if (!files.length) return
    setBusy(true)
    setProgress(0)
    try {
      const res = await api.files.upload(files, (p) => setProgress(p))
      const uploaded = res?.uploaded || []
      setItems((x) => [...uploaded, ...x])
      toast.success(`Загружено: ${uploaded.length}`)
    } catch (e) {
      console.error(e)
      toast.error('Не удалось загрузить')
    } finally {
      setBusy(false)
      setProgress(0)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    doUpload(e.dataTransfer.files)
  }

  return (
    <div className="container-wide px-6 py-10" id="main">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <h1 className="text-2xl font-semibold">
          Файлы / ссылки {q && <span className="text-fg/60 text-base">· поиск: “{q}”</span>}
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

      {/* Фильтры */}
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

      {/* Зона загрузки */}
      <div
        className={
          'mt-6 rounded-2xl border-2 border-dashed p-6 text-sm ' +
          (dragOver ? 'border-accent-500 bg-white/5' : 'border-white/15 bg-glass-bg')
        }
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-fg/80">
            Перетащи файлы сюда или выбери вручную. Сохранится в <code>/u/&lt;id&gt;/…</code>
          </div>
          <label className="btn btn-primary cursor-pointer">
            Выбрать файлы
            <input
              type="file"
              multiple
              hidden
              onChange={(e) => {
                const f = e.currentTarget.files
                e.currentTarget.value = ''
                doUpload(f)
              }}
            />
          </label>
        </div>
        {busy && (
          <div className="mt-3 rounded-xl bg-white/10 overflow-hidden">
            <div
              className="h-2"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg,#b6ffe3,#4fd4a6)',
              }}
            />
          </div>
        )}
      </div>

      {/* Добавление ссылки */}
      <form onSubmit={addLink} className="mt-4 grid gap-3 sm:grid-cols-[2fr_3fr_1fr_auto]">
        <input
          className="input"
          placeholder="Название"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <input
          className="input"
          placeholder="https://… или /u/…"
          value={form.url}
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
        />
        <input
          className="input"
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        />
        <button className="btn btn-primary" disabled={busy}>
          Добавить
        </button>
        <div className="sm:col-span-4">
          <TagInput
            value={form.tags}
            onChange={(tags) => setForm((f) => ({ ...f, tags }))}
            suggestions={allTags}
            placeholder="теги ссылки"
          />
        </div>
      </form>

      {/* Список / Плитка */}
      <div className="mt-8 grid gap-3">
        {loading && (
          <>
            <Skeleton lines={2} />
            <Skeleton lines={3} />
          </>
        )}

        {!loading && filtered.length === 0 && (
          <EmptyState
            title="Здесь пусто"
            subtitle="Загрузи файлы или добавь ссылки вручную"
            action={
              <label className="btn btn-primary cursor-pointer">
                Выбрать файлы
                <input
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => {
                    const f = e.currentTarget.files
                    e.currentTarget.value = ''
                    doUpload(f)
                  }}
                />
              </label>
            }
          />
        )}

        {!loading &&
          filtered.length > 0 &&
          view === 'list' &&
          filtered.map((f) => (
            <div
              key={f.id}
              className="card p-5 grid gap-3 sm:grid-cols-[1fr_2fr_1fr_auto] items-center"
            >
              <input
                className="input"
                defaultValue={f.name}
                onBlur={(e) => saveItem(f.id, { name: e.target.value })}
              />
              <input
                className="input"
                defaultValue={f.url}
                onBlur={(e) => saveItem(f.id, { url: e.target.value })}
              />
              <input
                className="input"
                type="date"
                defaultValue={f.date || ''}
                onBlur={(e) => saveItem(f.id, { date: e.target.value })}
              />
              <div className="flex gap-2 justify-end">
                <a className="btn btn-ghost" href={f.url} target="_blank" rel="noreferrer">
                  Открыть
                </a>
                <button className="btn btn-ghost" onClick={() => removeItem(f.id)}>
                  Удалить
                </button>
              </div>
              <div className="sm:col-span-4 -mt-1">
                <div className="flex flex-wrap gap-1">
                  {String(f.tags || '')
                    .split(',')
                    .filter(Boolean)
                    .map((t) => (
                      <span key={t} className="chip" data-variant="accent">
                        #{t}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          ))}

        {!loading && filtered.length > 0 && view === 'grid' && (
          <div className="grid-cards">
            {filtered.map((f) => (
              <div key={f.id} className="card p-5 flex flex-col gap-3">
                <div className="text-base font-medium">{f.name}</div>
                <div className="text-sm text-fg/70">{f.date || '—'}</div>
                <div className="flex flex-wrap gap-1">
                  {String(f.tags || '')
                    .split(',')
                    .filter(Boolean)
                    .map((t) => (
                      <span key={t} className="chip" data-variant="accent">
                        #{t}
                      </span>
                    ))}
                </div>
                <div className="mt-auto flex gap-2">
                  <a className="btn btn-ghost" href={f.url} target="_blank" rel="noreferrer">
                    Открыть
                  </a>
                  <button className="btn btn-ghost" onClick={() => removeItem(f.id)}>
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
