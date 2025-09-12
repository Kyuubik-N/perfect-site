import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const titleMap = {
  '/': 'Главная',
  '/catalog': 'Каталог',
  '/notes': 'Заметки',
  '/files': 'Файлы',
  '/calendar': 'Календарь',
  '/library': 'Библиотека',
  '/settings': 'Настройки',
}

export default function Breadcrumbs() {
  const loc = useLocation()
  const p = (loc.pathname || '/').replace(/\/+$/, '') || '/'

  // скрываем на главной
  if (p === '/') return null

  const title = titleMap[p] || 'Страница'

  return (
    <div className="container-wide px-4 sm:px-6 mt-20 mb-2">
      <nav aria-label="Хлебные крошки" className="crumbs glass px-3 py-1.5">
        <Link to="/" className="crumb">
          Kyuubik
        </Link>
        <span className="mx-2 text-fg/50">/</span>
        <span className="crumb active">{title}</span>
      </nav>
    </div>
  )
}
