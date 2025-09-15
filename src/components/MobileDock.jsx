import React from 'react'
import { NavLink } from 'react-router-dom'

const Item = ({ to, label, icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl border ${
        isActive ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'
      }`
    }
  >
    <span aria-hidden className="opacity-90">
      {icon}
    </span>
    <span className="text-xs opacity-90">{label}</span>
  </NavLink>
)

export default function MobileDock() {
  return (
    <div className="fixed md:hidden bottom-4 left-0 right-0">
      <div className="container-wide px-4">
        <div className="backdrop-blur-xs shadow-soft border border-white/10 rounded-2xl bg-white/8 p-2 flex justify-around">
          <Item to="/notes" label="Заметки" icon="📝" />
          <Item to="/files" label="Файлы" icon="📁" />
          <Item to="/calendar" label="Календарь" icon="📅" />
          <Item to="/settings" label="Настройки" icon="⚙️" />
        </div>
      </div>
    </div>
  )
}
