import { useEffect, useState } from 'react'

export default function ApiStatus() {
  const [ok, setOk] = useState(true)
  useEffect(() => {
    let mounted = true
    const tick = async () => {
      try {
        const r = await fetch('/api/ping', { credentials: 'include' })
        if (!mounted) return
        if (r.ok) {
          try {
            const d = await r.json()
            setOk(Boolean(d?.ok))
          } catch {
            setOk(true)
          }
        } else {
          setOk(false)
        }
      } catch {
        if (mounted) setOk(false)
      }
    }
    tick()
    const id = setInterval(tick, 10000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])
  return (
    <div className="hidden sm:flex items-center gap-2 text-xs text-white/60">
      <span className={`size-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
      API {ok ? 'online' : 'offline'}
    </div>
  )
}
