import React from 'react'
import api from '@/lib/api'
import { toast } from '@/components/toast/Toaster.jsx'
import TagInput from '@/components/TagInput.jsx'
import EmptyState from '@/components/EmptyState.jsx'

function useDebounced(value, ms = 250) {
  const [v, setV] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

function Favicon({ domain }) {
  if (!domain) return null
  const src =
    domain === 'local'
      ? '/favicon.ico'
      : `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
  return <img src={src} alt="" className="w-4 h-4 rounded-sm" loading="lazy" />
}

function Card({ item, meta, onOpen, onRefresh }) {
  const title = meta?.title || item.name || item.url
  const desc = meta?.description || ''
  const img = meta?.image || ''
  const domain = item.domain || meta?.domain || ''
  const tags = String(item.tags || '')
    .split(',')
    .filter(Boolean)

  return (
    <div className="card overflow-hidden group">
      {img && (
        <div className="aspect-[16/9] w-full bg-black/20">
          <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs opacity-80">
          <Favicon domain={domain} />
          <span className="truncate">{domain || '—'}</span>
          {item.date && <span className="ml-auto chip">{item.date}</span>}
        </div>
        <div className="mt-2 font-medium line-clamp-2">{title}</div>
        {desc && <div className="mt-1 text-sm opacity-80 line-clamp-3">{desc}</div>}

        <div className="mt-3 flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} className="chip">
              #{t}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button className="btn btn-primary" onClick={() => onOpen(item.url)}>
            Открыть
          </button>
          <button
            className="btn btn-ghost"
            onClick={() =>
              navigator.clipboard
                .writeText(item.url)
                .then(() => toast.success('Ссылка скопирована'))
            }
          >
            Копировать
          </button>
          <button
            className="btn btn-ghost ml-auto opacity-70 hover:opacity-100"
            onClick={() => onRefresh(item.url)}
          >
            Обновить превью
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LibraryPage() {
  const [items, setItems] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [q, setQ] = React.useState('')
  const dq = useDebounced(q, 200)
  const [selTags, setSelTags] = React.useState([])
  const [metas, setMetas] = React.useState({}) // url -> meta
  const [allTags, setAllTags] = React.useState([])

  React.useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        setLoading(true)
        const [rows, tags] = await Promise.all([api.library.list(), api.tags.list()])
        if (!ignore) {
          setItems(rows)
          setAllTags(tags.tags || [])
        }
        // подгружаем OG метаданные порциями
        const first = rows.slice(0, 18)
        const results = await Promise.allSettled(first.map((it) => api.og(it.url)))
        const map = {}
        first.forEach((it, i) => {
          const r = results[i]
          if (r.status === 'fulfilled') map[it.url] = r.value
        })
        if (!ignore) setMetas(map)
      } catch {
        toast.error('Не удалось загрузить библиотеку')
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => {
      ignore = true
    }
  }, [])

  function openUrl(url) {
    if (/^https?:\/\//i.test(url) || url.startsWith('/u/')) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  async function refreshMeta(url) {
    try {
      const m = await api.og(url, true)
      setMetas((prev) => ({ ...prev, [url]: m }))
      toast.success('Превью обновлено')
    } catch {
      toast.error('Не удалось обновить превью')
    }
  }

  const filtered = React.useMemo(() => {
    const needle = dq.trim().toLowerCase()
    return items.filter((it) => {
      const t = (it.name || '').toLowerCase()
      const u = (it.url || '').toLowerCase()
      const hasQ = !needle || t.includes(needle) || u.includes(needle)
      const tags = String(it.tags || '')
        .split(',')
        .filter(Boolean)
      const hasTags = !selTags.length || selTags.every((x) => tags.includes(x))
      return hasQ && hasTags
    })
  }, [items, dq, selTags])

  return (
    <div className="container-wide px-6 py-10" id="main">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-semibold">Библиотека</h1>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <input
            className="input flex-1"
            placeholder="Поиск по названию или URL"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <TagInput
            value={selTags}
            onChange={setSelTags}
            suggestions={allTags}
            placeholder="теги"
          />
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="card h-56 skel"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Пусто"
          subtitle="Добавляй ссылки в разделах «Файлы» и «Заметки» — они появятся здесь карточками."
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((it) => (
            <Card
              key={`${it.kind}-${it.id}`}
              item={it}
              meta={metas[it.url]}
              onOpen={openUrl}
              onRefresh={refreshMeta}
            />
          ))}
        </div>
      )}
    </div>
  )
}
