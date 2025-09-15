import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Breadcrumbs() {
  const { pathname } = useLocation()
  const parts = pathname.replace(/^\/+/, '').split('/').filter(Boolean)
  if (parts.length === 0) return null

  const crumbs = []
  for (let i = 0; i < parts.length; i++) {
    const href = '/' + parts.slice(0, i + 1).join('/')
    const label = parts[i].charAt(0).toUpperCase() + parts[i].slice(1)
    crumbs.push({ href, label })
  }

  return (
    <nav aria-label="Хлебные крошки" className="mt-2 text-sm opacity-80">
      <ol className="flex items-center flex-wrap gap-2">
        <li>
          <Link to="/" className="hover:underline opacity-90">
            Главная
          </Link>
        </li>
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex items-center gap-2">
            <span aria-hidden className="opacity-50">
              /
            </span>
            {i === crumbs.length - 1 ? (
              <span className="opacity-90">{c.label}</span>
            ) : (
              <Link to={c.href} className="hover:underline">
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
