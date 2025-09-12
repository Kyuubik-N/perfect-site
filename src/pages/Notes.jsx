import React from 'react'
import Protected from '../components/Protected'
import { ymd } from '../db'
import { api } from '../lib/api'
import Button from '../components/ui/Button'
import GlassCard from '../components/GlassCard'

export default function NotesPage() {
  const [notes, setNotes] = React.useState([])
  const [title, setTitle] = React.useState('')
  const [date, setDate] = React.useState(ymd())
  const [content, setContent] = React.useState('')

  const load = React.useCallback(async () => {
    try {
      const rows = await api('/api/notes')
      const mapped = rows.map((r) => ({
        id: r.id,
        title: r.title,
        content: r.text,
        date: r.date,
        createdAt: 0,
      }))
      setNotes(mapped)
    } catch (e) {
      console.error(e)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const onAdd = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    await api('/api/notes', { method: 'POST', body: { title: title.trim(), text: content, date } })
    setTitle('')
    setContent('')
    await load()
  }

  return (
    <Protected>
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-semibold gradient-text">Заметки</h2>

        <form onSubmit={onAdd} className="mt-6 glass p-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              className="input flex-1"
              placeholder="Заголовок"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="date"
              className="input max-w-[14rem]"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Button type="submit">Добавить</Button>
          </div>
          <textarea
            rows={3}
            className="input"
            placeholder="Текст заметки (необязательно)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </form>

        <div className="mt-6 grid gap-4">
          {notes.length === 0 && <div className="text-white/60">Пока нет заметок</div>}
          {notes.map((n) => (
            <GlassCard key={n.id} className="hover:shadow-soft transition">
              <div className="flex items-center justify-between">
                <div className="font-medium text-white/90">{n.title}</div>
                <div className="text-sm text-white/60">{n.date}</div>
              </div>
              {n.content && (
                <div className="mt-2 text-white/80 whitespace-pre-wrap">{n.content}</div>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      await api(`/api/notes/${n.id}`, { method: 'DELETE' })
                    } finally {
                      await load()
                    }
                  }}
                  className="px-3 py-1.5 rounded-md focus-ring text-red-300 hover:bg-red-900/10"
                >
                  Удалить
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>
    </Protected>
  )
}
