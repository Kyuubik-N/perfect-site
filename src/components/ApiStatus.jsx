import React from 'react'

export default function ApiStatus() {
  const [online, setOnline] = React.useState(false)
  const [latency, setLatency] = React.useState(null)

  const check = React.useCallback(async () => {
    const start = performance.now()
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 3500) // 3.5s таймаут

    try {
      // Пытаемся обратиться к /api/ping (если его нет — придёт 404,
      // что для нас тоже сигнал, что сервер доступен).
      const res = await fetch('/api/ping', {
        method: 'GET',
        credentials: 'include',
        signal: ctrl.signal,
        headers: { 'cache-control': 'no-cache' },
      })
      clearTimeout(timer)
      setLatency(Math.round(performance.now() - start))
      // Любой ответ (даже 401/404/500) = сервер доступен по сети.
      setOnline(true)

      // На всякий случай: если CORS/проксирование настроено на /api,
      // но /api/ping отсутствует, можно fallback'ом дёрнуть существующий роут:
      if (!res.ok && res.status === 404) {
        // Пробуем HEAD к ресурсу, который точно есть (обычно /api/notes требует авторизацию)
        try {
          const res2 = await fetch('/api/notes', {
            method: 'HEAD',
            credentials: 'include',
            signal: ctrl.signal,
            headers: { 'cache-control': 'no-cache' },
          })
          // Если ответили — оставляем online = true
          void res2
        } catch {
          // Игнор: первый запрос уже показал, что сервер отвечает
        }
      }
    } catch {
      clearTimeout(timer)
      setLatency(null)
      setOnline(false) // Сетевая ошибка / таймаут
    }
  }, [])

  React.useEffect(() => {
    check()
    const id = setInterval(check, 15000) // каждые 15с
    return () => clearInterval(id)
  }, [check])

  return (
    <div
      className="inline-flex items-center gap-2"
      title={online ? `API online${latency != null ? ` · ${latency} ms` : ''}` : 'API offline'}
      aria-label={online ? 'API online' : 'API offline'}
    >
      <span
        className={`inline-block size-2 rounded-full ${
          online
            ? 'bg-green-400 shadow-[0_0_0_3px_rgba(74,222,128,.25)]'
            : 'bg-red-400 shadow-[0_0_0_3px_rgba(248,113,113,.25)]'
        }`}
      />
      <span className="text-sm text-white/70 select-none">
        {online ? 'API online' : 'API offline'}
      </span>
    </div>
  )
}
