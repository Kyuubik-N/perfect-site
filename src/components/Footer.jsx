import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-16">
      <div className="container-wide px-6 py-10">
        <div className="card p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="opacity-80 text-sm">
            © {new Date().getFullYear()} Kyuubik — личное пространство
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            <Link to="/notes" className="navlink">
              Заметки
            </Link>
            <Link to="/files" className="navlink">
              Файлы
            </Link>
            <Link to="/settings" className="navlink">
              Настройки
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
