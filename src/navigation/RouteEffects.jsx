import React from 'react'
import { useLocation } from 'react-router-dom'

export default function RouteEffects() {
  const loc = useLocation()

  React.useEffect(() => {
    // плавный скролл вверх (не мешаем, если якорь)
    if (!loc.hash) window.scrollTo({ top: 0, behavior: 'smooth' })

    // запоминаем последний не-home путь
    const p = (loc.pathname || '/').replace(/\/+$/, '') || '/'
    if (p !== '/') localStorage.setItem('last_non_home_path', p)

    // фокус на контент ради доступности
    const main = document.getElementById('content')
    if (main) {
      main.setAttribute('tabindex', '-1')
      main.focus({ preventScroll: true })
      // убираем tabindex после фокуса
      setTimeout(() => main.removeAttribute('tabindex'), 100)
    }

    // объявляем смену страницы для скринридеров
    const live = document.getElementById('route-announcer')
    if (live) live.textContent = document.title
  }, [loc.key, loc.pathname, loc.hash])

  return <div id="route-announcer" aria-live="polite" className="sr-only" />
}
