import React from 'react'

function isChunkError(err) {
  const msg = String(err && (err.message || err))
  return (
    /Loading chunk [\w-]+ failed/i.test(msg) ||
    /ChunkLoadError/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  )
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error) {
    if (isChunkError(error)) {
      // Attempt to recover automatically once
      try {
        const tried = sessionStorage.getItem('reloaded_after_chunk_error')
        if (!tried) {
          sessionStorage.setItem('reloaded_after_chunk_error', '1')
          window.location.reload()
          return
        }
      } catch {}
    }
  }
  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const isChunk = isChunkError(error)
    return (
      <div className="container-wide px-6 pt-28 pb-20">
        <div className="glass p-6 rounded-2xl">
          <h2 className="heading text-2xl mb-2">Произошла ошибка</h2>
          <div className="text-white/70 text-sm break-words">
            {String((error && error.message) || error)}
          </div>
          {isChunk && (
            <div className="mt-3 text-white/70 text-sm">
              Похоже, приложение обновилось. Перезагрузите страницу.
            </div>
          )}
          <div className="mt-4">
            <button className="btn" onClick={() => window.location.reload()}>
              Перезагрузить
            </button>
          </div>
        </div>
      </div>
    )
  }
}
