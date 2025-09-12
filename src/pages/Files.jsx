import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import EmbedPlayer, { getEmbedInfo } from '../components/EmbedPlayer'
import FileGrid from '../components/FileGrid'
import { useToast } from '../components/toast/Toaster'
import { api } from '../lib/api'
import { ymd } from '../db'

function isImageUrl(url) {
  return /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?.*)?$/i.test(url)
}
function isVideoUrl(url) {
  return /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(url)
}
function isAudioUrl(url) {
  return /\.(mp3|wav|ogg|aac|m4a|flac)(\?.*)?$/i.test(url)
}

function kindOf(url = '') {
  if (!url) return 'link'
  // Встроенные провайдеры (YouTube/Vimeo/и т.д.) считаем ссылками, а не "Видео"
  // чтобы фильтр "Ссылки" включал их.
  if (getEmbedInfo(url)) return 'link'
  if (isVideoUrl(url)) return 'video'
  if (isAudioUrl(url)) return 'audio'
  if (isImageUrl(url)) return 'image'
  return 'link'
}

function PreviewRemote({ item }) {
  const url = item.url || ''
  const embed = getEmbedInfo(url)
  if (embed) return <EmbedPlayer url={url} title={item.name || 'Видео'} />
  if (isImageUrl(url))
    return (
      <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingTop: '56.25%' }}>
        <img
          src={url}
          alt={item.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    )
  if (isVideoUrl(url))
    return (
      <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingTop: '56.25%' }}>
        <video
          src={url}
          className="absolute inset-0 w-full h-full object-cover"
          controls
          preload="metadata"
        />
      </div>
    )
  if (isAudioUrl(url)) return <audio src={url} className="w-full" controls preload="none" />
  if (url)
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-accent-200 underline break-all"
      >
        {url}
      </a>
    )
  return <div className="text-white/60">Нет предпросмотра</div>
}

function FilesInner() {
  const { toast } = useToast()
  const [date, setDate] = React.useState(ymd())
  const [files, setFiles] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [url, setUrl] = React.useState('')
  const [name, setName] = React.useState('')
  const [query, setQuery] = React.useState('')
  const [view, setView] = React.useState(() => {
    try {
      return localStorage.getItem('files_view') === 'list' ? 'list' : 'grid'
    } catch {
      return 'grid'
    }
  })
  const [filter, setFilter] = React.useState('all') // all|video|image|audio|link
  const [sort, setSort] = React.useState('date_desc') // date_desc|date_asc|name_az|name_za
  const [editingId, setEditingId] = React.useState(null)
  const [editingName, setEditingName] = React.useState('')
  const [selected, setSelected] = React.useState(() => new Set())
  const [lightbox, setLightbox] = React.useState(null) // выбранный элемент для предпросмотра
  const [lightboxIndex, setLightboxIndex] = React.useState(-1)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const rows = await api('/api/files')
      setFiles(Array.isArray(rows) ? rows : [])
      setError('')
    } catch (e) {
      setError(e?.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const onPick = async (_e) => {
    /* TODO: загрузка файлов на сервер */
  }

  // Добавление одной ссылки (вспомог.)
  async function addOneUrl(raw) {
    if (!raw) return
    let u = raw.trim()
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u
    const exists = files.some((f) => (f.url || '').trim() === u)
    if (exists) {
      toast('Такая ссылка уже есть')
      return
    }
    const nm = u.split('/').pop() || 'Файл'
    await api('/api/files', { method: 'POST', body: { name: nm, date, url: u } })
  }

  const onAddLink = async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    let u = url.trim()
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u
    // duplicates check
    const exists = files.some((f) => (f.url || '').trim() === u)
    if (exists) {
      toast('Такая ссылка уже есть')
      return
    }
    const nm = name.trim() || u.split('/').pop() || 'Файл'
    try {
      await api('/api/files', { method: 'POST', body: { name: nm, date, url: u } })
      setUrl('')
      setName('')
      await load()
      toast('Ссылка добавлена')
    } catch (e) {
      setError(e?.message || 'Ошибка добавления')
    }
  }

  const filtered = React.useMemo(() => {
    let list = files.slice()
    if (filter !== 'all') list = list.filter((f) => kindOf(f.url) === filter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (f) => (f.name || '').toLowerCase().includes(q) || (f.url || '').toLowerCase().includes(q),
      )
    }
    switch (sort) {
      case 'date_asc':
        list.sort((a, b) => String(a.date).localeCompare(String(b.date)))
        break
      case 'name_az':
        list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
        break
      case 'name_za':
        list.sort((a, b) => String(b.name || '').localeCompare(String(a.name || '')))
        break
      default:
        list.sort((a, b) => String(b.date).localeCompare(String(a.date)))
    }
    return list
  }, [files, filter, query, sort])

  const startEdit = (f) => {
    setEditingId(f.id)
    setEditingName(f.name || '')
  }
  const saveEdit = async (f) => {
    await api(`/api/files/${f.id}`, { method: 'PATCH', body: { name: editingName } })
    setEditingId(null)
    setEditingName('')
    await load()
    toast('Название обновлено')
  }

  // Выделение и массовые действия
  const toggleSelect = (id) =>
    setSelected((prev) => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  const clearSelection = () => setSelected(new Set())
  const selectAllFiltered = () => setSelected(new Set(filtered.map((f) => f.id)))
  const bulkDelete = async () => {
    for (const id of selected) {
      await api(`/api/files/${id}`, { method: 'DELETE' })
    }
    await load()
    clearSelection()
    toast('Удалено')
  }
  const bulkCopy = async () => {
    const text = filtered
      .filter((f) => selected.has(f.id) && f.url)
      .map((f) => f.url)
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast('Скопировано')
    } catch {}
  }
  const bulkOpen = () => {
    filtered
      .filter((f) => selected.has(f.id) && f.url)
      .forEach((f) => window.open(f.url, '_blank', 'noopener'))
  }

  React.useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        selectAllFiltered()
      }
      if (e.key === 'Escape') {
        clearSelection()
      }
      if (e.key === 'Delete' && selected.size > 0) {
        if (confirm(`Удалить выбранные (${selected.size})?`)) bulkDelete()
      }
      if (e.key === '/') {
        e.preventDefault()
        const el = document.getElementById('files-search')
        el?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, filtered])

  return (
    <section
      className="relative z-10 max-w-6xl mx-auto px-6 py-10"
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
      }}
      onDrop={async (e) => {
        e.preventDefault()
        const data = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
        let added = 0
        if (data) {
          const lines = data
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean)
          for (const line of lines) {
            await addOneUrl(line)
            added++
          }
        }
        if (added > 0) {
          await load()
          toast(`Добавлено: ${added}`)
        }
      }}
    >
      {/* Заголовок + поиск/сортировка */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
        <h2 className="heading text-2xl sm:text-3xl text-glow">Файлы</h2>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <input
            id="files-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск /"
            className="input w-full sm:w-56 min-w-0"
          />
          <select
            aria-label="Сортировка"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input w-[11rem] sm:w-auto min-w-[10.5rem]"
          >
            <option value="date_desc">Новые сверху</option>
            <option value="date_asc">Старые сверху</option>
            <option value="name_az">Имя A→Я</option>
            <option value="name_za">Имя Я→A</option>
          </select>
        </div>
      </div>

      {/* Фильтры в отдельной полосе, прокрутка по X на узких экранах */}
      <div className="mt-4 glass px-1 py-1 rounded-xl overflow-x-auto no-scrollbar">
        <div className="flex gap-1 min-w-max">
          {['all', 'video', 'image', 'audio', 'link'].map((k) => (
            <button
              key={k}
              className={`glass-button ${filter === k ? 'glass-toggle-active bg-white/10' : ''}`}
              onClick={() => setFilter(k)}
              aria-pressed={filter === k}
            >
              {k === 'all'
                ? 'Все'
                : k === 'video'
                  ? 'Видео'
                  : k === 'image'
                    ? 'Картинки'
                    : k === 'audio'
                      ? 'Аудио'
                      : 'Ссылки'}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <div className="mt-3 glass p-3 rounded-xl text-sm text-red-300">
          Ошибка: {error === 'unauthorized' ? 'Нужна авторизация — войдите заново.' : error}
        </div>
      )}

      {
        <form onSubmit={onAddLink} className="mt-4 glass p-4">
          <div className="flex items-center gap-3 md:flex-row flex-col">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input md:flex-1 w-full"
              placeholder="Вставьте ссылку (https://...)"
              aria-label="Ссылка"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input md:w-72 w-full"
              placeholder="Название (опционально)"
              aria-label="Название"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input md:w-44 w-full"
              aria-label="Дата"
            />
            <button type="submit" className="glass-button w-full md:w-auto md:ml-auto">
              Добавить
            </button>
          </div>
        </form>
      }

      <div className="mt-6">
        <FileGrid
          items={filtered}
          loading={loading}
          emptyText={files.length === 0 ? 'Пока нет файлов' : 'Ничего не найдено'}
          onPreview={(f) => {
            setLightbox(f)
            setLightboxIndex(filtered.findIndex((it) => it.id === f.id))
          }}
          onOpen={(f) => {
            if (f.url) window.open(f.url, '_blank', 'noopener')
          }}
          onCopy={async (f) => {
            if (!f.url) return
            try {
              await navigator.clipboard.writeText(f.url)
              toast('Скопировано')
            } catch {}
          }}
          onDelete={async (f) => {
            await api(`/api/files/${f.id}`, { method: 'DELETE' })
            await load()
            toast('Удалено')
          }}
          onRename={async (f) => {
            const next = prompt('Новое имя', f.name || '')
            if (next == null) return
            const nm = next.trim()
            if (!nm || nm === (f.name || '')) return
            await api(`/api/files/${f.id}`, { method: 'PATCH', body: { name: nm } })
            await load()
            toast('Название обновлено')
          }}
        />
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            setLightbox(null)
            setLightboxIndex(-1)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setLightbox(null)
              setLightboxIndex(-1)
            }
            if (e.key === 'ArrowLeft') {
              const i = (lightboxIndex - 1 + filtered.length) % filtered.length
              setLightbox(filtered[i])
              setLightboxIndex(i)
            }
            if (e.key === 'ArrowRight') {
              const i = (lightboxIndex + 1) % filtered.length
              setLightbox(filtered[i])
              setLightboxIndex(i)
            }
          }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <PreviewRemote item={lightbox} />
            <div className="mt-3 flex justify-between items-center">
              <div className="text-neutral-200 truncate">{lightbox.name || lightbox.url}</div>
              <div className="flex flex-wrap gap-1">
                <button
                  className="glass-button"
                  onClick={() => {
                    const i = (lightboxIndex - 1 + filtered.length) % filtered.length
                    setLightbox(filtered[i])
                    setLightboxIndex(i)
                  }}
                  aria-label="Предыдущий"
                >
                  ◀
                </button>
                <button
                  className="glass-button"
                  onClick={() => {
                    const i = (lightboxIndex + 1) % filtered.length
                    setLightbox(filtered[i])
                    setLightboxIndex(i)
                  }}
                  aria-label="Следующий"
                >
                  ▶
                </button>
                <button
                  className="glass-button"
                  onClick={() => {
                    setLightbox(null)
                    setLightboxIndex(-1)
                  }}
                  aria-label="Закрыть"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default function FilesPage() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="container-wide pt-32 text-white/70">Загрузка…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <FilesInner />
}
