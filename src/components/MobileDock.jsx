import React from 'react'
import { NavLink } from 'react-router-dom'

const Item = ({ to, label, icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) => 'dock-item' + (isActive ? ' is-active' : '')}
    aria-label={label}
    title={label}
  >
    <span className="dock-icon">{icon}</span>
    <span className="dock-label">{label}</span>
  </NavLink>
)

export default function MobileDock() {
  return (
    <nav className="mobile-dock">
      <Item to="/" label="Главная" icon="🏠" />
      <Item to="/catalog" label="Каталог" icon="🗂" />
      <Item to="/notes" label="Заметки" icon="📝" />
      <Item to="/files" label="Файлы" icon="📁" />
      <Item to="/settings" label="Настройки" icon="⚙️" />
    </nav>
  )
}
