import React from 'react'

export default function Modal({ open, onClose, children, title, actions }) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="v-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="v-modal" role="dialog" aria-modal="true">
        <header className="v-header">
          <div className="truncate">{title}</div>
          <div className="ml-auto flex items-center gap-2">
            {actions}
            <button className="glass-button glass-button--icon" onClick={onClose} title="Закрыть">
              ✕
            </button>
          </div>
        </header>
        <div className="v-body">{children}</div>
      </div>
    </div>
  )
}
