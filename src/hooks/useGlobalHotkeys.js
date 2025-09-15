import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function useGlobalHotkeys() {
  const navigate = useNavigate()

  useEffect(() => {
    let goMode = false

    const onKey = (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const el = document.querySelector('#global-search')
        if (el) {
          e.preventDefault()
          el.focus()
        }
      }

      // Alt+1..6 — быстрые вкладки
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key >= '1' && e.key <= '6') {
          const map = ['/', '/notes', '/files', '/calendar', '/library', '/settings']
          const idx = parseInt(e.key, 10) - 1
          navigate(map[idx] || '/')
        }
      }

      // g -> h/c/n/f/s  (go to …)
      if (!goMode && e.key === 'g') {
        goMode = true
        setTimeout(() => (goMode = false), 1200)
        return
      }
      if (goMode) {
        if (e.key === 'h') navigate('/')
        if (e.key === 'n') navigate('/notes')
        if (e.key === 'f') navigate('/files')
        if (e.key === 'c') navigate('/calendar')
        if (e.key === 's') navigate('/settings')
        goMode = false
      }
    }

    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [navigate])
}
