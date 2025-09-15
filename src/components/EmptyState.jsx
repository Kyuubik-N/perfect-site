import React from 'react'

export default function EmptyState({
  title = 'Пока пусто',
  subtitle = 'Добавь что-нибудь, чтобы начать',
  action = null,
}) {
  return (
    <div className="card p-8 text-center">
      <div className="mx-auto w-24 h-24 rounded-full bg-white/6 border border-white/15 flex items-center justify-center shadow-soft">
        <svg
          width="42"
          height="42"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="opacity-80"
        >
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M3 8h18M7 12h6" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm opacity-75">{subtitle}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
