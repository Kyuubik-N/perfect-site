import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ToasterProvider } from './components/toast/Toaster'
import './index.css'
import './utils/theme'
import './i18n'

// Ensure no dev service worker interferes with /api requests
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((rs) => rs.forEach((r) => r.unregister()))
    .catch(() => {})
}

// Gracefully recover from dynamic import chunk errors (often due to SW cache)
window.addEventListener('unhandledrejection', (e) => {
  try {
    const msg = String(e && (e.reason?.message || e.reason || ''))
    if (/ChunkLoadError/i.test(msg) || /Failed to fetch dynamically imported module/i.test(msg)) {
      const tried = sessionStorage.getItem('reloaded_after_chunk_error')
      if (!tried) {
        sessionStorage.setItem('reloaded_after_chunk_error', '1')
        window.location.reload()
      }
    }
  } catch {}
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToasterProvider>
        <AuthProvider>
          {/* Error boundary to catch lazy chunk errors and others */}
          <App />
        </AuthProvider>
      </ToasterProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
