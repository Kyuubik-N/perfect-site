import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'

function useActions() {
  const navigate = useNavigate()
  return useMemo(
    () => [
      { label: 'Главная', run: () => navigate('/') },
      { label: 'Заметки', run: () => navigate('/notes') },
      { label: 'Календарь', run: () => navigate('/calendar') },
      { label: 'Каталог', run: () => navigate('/catalog') },
      { label: 'Файлы', run: () => navigate('/files') },
      {
        label: 'Добавить заметку',
        run: () => document.dispatchEvent(new CustomEvent('quick-add-note')),
      },
    ],
    [navigate],
  )
}

export default function CommandK() {
  const actions = useActions()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const list = actions.filter((a) => a.label.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <Button className="hidden sm:flex" onClick={() => setOpen(true)}>
        ⌘K
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-[70] grid place-items-start pt-28 bg-black/30 backdrop-blur-xs"
          onClick={() => setOpen(false)}
        >
          <div className="card w-[min(640px,92vw)] mx-auto" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Что сделать?"
              className="input w-full mb-3"
            />
            <ul className="max-h-72 overflow-auto">
              {list.map((a, i) => (
                <li key={i}>
                  <button
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[.06]"
                    onClick={() => {
                      a.run()
                      setOpen(false)
                    }}
                  >
                    {a.label}
                  </button>
                </li>
              ))}
              {list.length === 0 && <li className="text-white/60 px-3 py-2">Ничего не найдено</li>}
            </ul>
            <div className="text-[11px] text-white/50 mt-2">Подсказка: нажмите Ctrl/Cmd + K</div>
          </div>
        </div>
      )}
    </>
  )
}
