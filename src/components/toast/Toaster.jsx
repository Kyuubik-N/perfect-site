import React from 'react'

const listeners = new Set()

export const toast = {
  _emit(payload) {
    for (const fn of listeners) fn(payload)
  },
  success(message) {
    this._emit({ id: crypto.randomUUID?.() || String(Math.random()), type: 'success', message })
  },
  error(message) {
    this._emit({ id: crypto.randomUUID?.() || String(Math.random()), type: 'error', message })
  },
  info(message) {
    this._emit({ id: crypto.randomUUID?.() || String(Math.random()), type: 'info', message })
  },
}

export default function Toaster() {
  const [items, setItems] = React.useState([])

  React.useEffect(() => {
    const on = (t) => {
      setItems((x) => [...x, t])
      const ttl = setTimeout(() => dismiss(t.id), 3600)
      return () => clearTimeout(ttl)
    }
    listeners.add(on)
    return () => listeners.delete(on)
  }, [])

  function dismiss(id) {
    setItems((x) => x.filter((i) => i.id !== id))
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {items.map((i) => (
        <div
          key={i.id}
          onClick={() => dismiss(i.id)}
          className={
            'cursor-pointer rounded-2xl px-4 py-3 shadow-soft backdrop-blur-xs ' +
            (i.type === 'error'
              ? 'bg-red-600/90 text-white'
              : i.type === 'success'
                ? 'bg-emerald-600/90 text-white'
                : 'bg-glass-bg text-fg')
          }
          role="status"
        >
          {i.message}
        </div>
      ))}
    </div>
  )
}
