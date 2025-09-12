import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import FileGrid from '../components/FileGrid'
import { api } from '../lib/api'
import { ymd } from '../db'
import Modal from '../components/viewer/Modal'
import EmbedPlayer from '../components/viewer/EmbedPlayer'

const isImg = (name = '') => /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(name)
const isVideo = (name = '') => /\.(mp4|webm|ogg|m4v|mov)$/i.test(name)

export default function FilesPage() {
  const { user } = useAuth()
  const [items, setItems] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  // viewer
  const [open, setOpen] = React.useState(false)
  const [index, setIndex] = React.useState(0)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const rows = await api('/api/files')
      setItems(rows || [])
    } catch (e) {
      setError(e.message || 'Не удалось загрузить')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  if (!user) return <Navigate to="/login" replace />

  const onPreview = (file) => {
    const idx = items.findIndex((x) => x.id === file.id)
    if (idx >= 0) {
      setIndex(idx)
      setOpen(true)
    }
  }
  const onOpen = (file) => {
    if (file.url) window.open(file.url, '_blank', 'noopener')
  }
  const onCopy = async (file) => {
    if (file.url && navigator.clipboard) {
      await navigator.clipboard.writeText(file.url)
    }
  }
  const onDelete = async (file) => {
    await api(`/api/files/${file.id}`, { method: 'DELETE' })
    load()
  }
  const onRename = async (file) => {
    const name = prompt('Новое имя', file.name || '') ?? null
    if (name === null) return
    await api(`/api/files/${file.id}`, { method: 'PATCH', body: { name } })
    load()
  }

  const curr = items[index]
  const next = () => setIndex((i) => (i + 1) % items.length)
  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length)

  return (
    <section className="container-wide px-6 py-10">
      <h2 className="text-2xl font-semibold gradient-text">Файлы</h2>

      {error && <div className="mt-4 text-red-300">{error}</div>}

      {/* Добавление ссылки */}
      <form
        className="glass p-4 rounded-2xl mt-6 grid gap-3 sm:grid-cols-[1fr_auto]"
        onSubmit={async (e) => {
          e.preventDefault()
          const form = e.currentTarget
          const input = form.querySelector('input[name="url"]')
          const url = input.value.trim()
          if (!url) return
          await api('/api/files', { method: 'POST', body: { url, date: ymd() } })
          input.value = ''
          load()
        }}
      >
        <input
          name="url"
          className="input"
          placeholder="Вставьте ссылку (YouTube, Vimeo, Spotify, сайт…)"
        />
        <button className="btn btn-primary">Добавить ссылку</button>
      </form>

      <div className="mt-6">
        <FileGrid
          items={items}
          loading={loading}
          onPreview={onPreview}
          onOpen={onOpen}
          onCopy={onCopy}
          onDelete={onDelete}
          onRename={onRename}
        />
      </div>

      {/* Модальное окно просмотра */}
      <Modal
        open={open && !!curr}
        onClose={() => setOpen(false)}
        title={curr?.name || curr?.url || 'Просмотр'}
        actions={
          <>
            {items.length > 1 && (
              <>
                <button
                  className="glass-button glass-button--icon"
                  onClick={prev}
                  title="Предыдущий"
                >
                  ←
                </button>
                <button
                  className="glass-button glass-button--icon"
                  onClick={next}
                  title="Следующий"
                >
                  →
                </button>
              </>
            )}
            {curr?.url && (
              <>
                <button
                  className="glass-button"
                  onClick={() => navigator.clipboard?.writeText(curr.url)}
                >
                  Скопировать
                </button>
                <button
                  className="glass-button"
                  onClick={() => window.open(curr.url, '_blank', 'noopener')}
                >
                  Открыть
                </button>
              </>
            )}
          </>
        }
      >
        {!curr ? null : isImg(curr.url || curr.name) ? (
          <img
            src={curr.url}
            alt={curr.name || ''}
            className="max-h-[75vh] w-auto object-contain rounded-xl"
          />
        ) : isVideo(curr.url || curr.name) ? (
          <video src={curr.url} controls className="max-h-[75vh] w-auto rounded-xl" />
        ) : curr.url ? (
          <EmbedPlayer url={curr.url} />
        ) : (
          <div className="text-white/75">Нет содержимого для предпросмотра</div>
        )}
      </Modal>
    </section>
  )
}
