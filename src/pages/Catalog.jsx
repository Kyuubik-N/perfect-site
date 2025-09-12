import React from 'react'
import Protected from '../components/Protected'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function CatalogPage() {
  const [counts, setCounts] = React.useState({ notes: 0, files: 0 })
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [notes, files] = await Promise.all([
          api('/api/notes').catch(() => []),
          api('/api/files').catch(() => []),
        ])
        if (!active) return
        setCounts({
          notes: Array.isArray(notes) ? notes.length : 0,
          files: Array.isArray(files) ? files.length : 0,
        })
      } catch (e) {
        if (active) setError(e?.message || 'Ошибка загрузки')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  return (
    <Protected>
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold gradient-text">Каталог</h2>
          {!loading && (
            <div className="text-sm text-white/60">
              Всего: заметок {counts.notes} · файлов {counts.files}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 glass p-3 rounded-xl text-sm text-red-300">Ошибка: {error}</div>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/notes"
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg p-6 hover:shadow-soft transition hover:scale-[1.01]"
          >
            <div className="text-4xl">📝</div>
            <div className="mt-3 text-white/90 font-medium text-lg">Заметки</div>
            <div className="text-white/60 text-sm">Идеи, ссылки и дела по датам.</div>
            <div className="mt-3 text-xs text-white/50">
              {loading ? 'Загрузка…' : `Всего: ${counts.notes}`}
            </div>
          </Link>
          <Link
            to="/calendar"
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg p-6 hover:shadow-soft transition hover:scale-[1.01]"
          >
            <div className="text-4xl">📆</div>
            <div className="mt-3 text-white/90 font-medium text-lg">Календарь</div>
            <div className="text-white/60 text-sm">Смотрите заметки и файлы по дням.</div>
            <div className="mt-3 text-xs text-white/50">Быстрый доступ по датам</div>
          </Link>
          <Link
            to="/files"
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg p-6 hover:shadow-soft transition hover:scale-[1.01]"
          >
            <div className="text-4xl">📁</div>
            <div className="mt-3 text-white/90 font-medium text-lg">Файлы</div>
            <div className="text-white/60 text-sm">Ссылки на медиа и документы.</div>
            <div className="mt-3 text-xs text-white/50">
              {loading ? 'Загрузка…' : `Всего: ${counts.files}`}
            </div>
          </Link>
        </div>
      </section>
    </Protected>
  )
}
