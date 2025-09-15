import React from 'react'
import { useLocation } from 'react-router-dom'

export default function RouteEffects() {
  const { pathname } = useLocation()

  React.useEffect(() => {
    // прокрутка к началу
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // если есть основной контент — ставим фокус
    const main = document.querySelector('#main')
    if (main) main.setAttribute('tabindex', '-1')
    if (main) main.focus({ preventScroll: true })
  }, [pathname])

  return null
}
