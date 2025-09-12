import { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext(null)

export function ToasterProvider({ children }) {
  const [list, setList] = useState([])
  const toast = useCallback((text) => {
    const id = globalThis.crypto?.randomUUID?.() || String(Date.now() + Math.random())
    setList((arr) => [...arr, { id, text }])
    setTimeout(() => setList((arr) => arr.filter((t) => t.id !== id)), 2600)
  }, [])
  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-6 right-6 space-y-2 z-[60]"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {list.map((t) => (
          <div key={t.id} className="glass px-4 py-2 rounded-xl text-sm shadow-soft">
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
