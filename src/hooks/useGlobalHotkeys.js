import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function useGlobalHotkeys() {
  const nav = useNavigate()
  const goMode = useRef(false)
  const goTimer = useRef(null)

  useEffect(() => {
    const isInput = (el) =>
      el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable

    const focusSearch = () => {
      const byAttr = document.querySelector('[data-search-input="true"]')
      const role = document.querySelector('[role="searchbox"]')
      const id = document.getElementById('global-search') || document.getElementById('file-search')
      const el = byAttr || role || id
      if (el) el.focus()
    }

    const goArm = () => {
      goMode.current = true
      clearTimeout(goTimer.current)
      goTimer.current = setTimeout(() => (goMode.current = false), 1200)
    }

    const onKey = (e) => {
      const k = e.key
      const meta = e.metaKey || e.ctrlKey
      const alt = e.altKey
      const target = e.target

      // не мешаем набору текста
      if (!meta && !alt && isInput(target) && k.length === 1) return

      // быстрые переходы Alt+1..6
      if (alt && !meta) {
        if (k === '1') {
          e.preventDefault()
          nav('/')
        }
        if (k === '2') {
          e.preventDefault()
          nav('/catalog')
        }
        if (k === '3') {
          e.preventDefault()
          nav('/notes')
        }
        if (k === '4') {
          e.preventDefault()
          nav('/files')
        }
        if (k === '5') {
          e.preventDefault()
          nav('/calendar')
        }
        if (k === '6') {
          e.preventDefault()
          nav('/settings')
        }
      }

      // «go»-режим: g h -> home, g n -> notes и т.д.
      if (!meta && !alt && k.toLowerCase() === 'g') {
        goArm()
        return
      }
      if (goMode.current) {
        const map = {
          h: '/',
          c: '/catalog',
          n: '/notes',
          f: '/files',
          l: '/library',
          s: '/settings',
        }
        const to = map[k.toLowerCase()]
        if (to) {
          e.preventDefault()
          nav(to)
          goMode.current = false
          return
        }
      }

      // / — фокус в поиск (если есть)
      if (!meta && !alt && k === '/') {
        e.preventDefault()
        focusSearch()
      }

      // N / L — быстрые действия (пусть просто ведут в разделы)
      if (!meta && !alt && (k === 'n' || k === 'N')) {
        e.preventDefault()
        nav('/notes')
      }
      if (!meta && !alt && (k === 'l' || k === 'L')) {
        e.preventDefault()
        nav('/files')
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nav])
}
