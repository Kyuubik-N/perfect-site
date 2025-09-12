import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { api } from '../lib/api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setL] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        setUser(await api('/api/me'))
      } catch (e) {
        // If cookie is stale/invalid, clear it to avoid loops
        const msg = e && e.message
        if (msg === 'invalid_token' || msg === 'unauthorized') {
          try {
            await api('/api/logout', { method: 'POST' })
          } catch {}
        }
        setUser(null)
      } finally {
        setL(false)
      }
    })()
  }, [])

  async function login(username, password) {
    await api('/api/login', { method: 'POST', body: { username, password } })
    setUser(await api('/api/me'))
  }
  async function register(username, password) {
    await api('/api/register', { method: 'POST', body: { username, password } })
    // cookie уже выставлена на /api/register — просто подтягиваем профиль
    setUser(await api('/api/me'))
  }
  async function logout() {
    await api('/api/logout', { method: 'POST' })
    setUser(null)
  }

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider/>')
  return ctx
}
