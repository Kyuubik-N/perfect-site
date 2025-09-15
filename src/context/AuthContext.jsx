import React, { createContext, useContext } from 'react'
import { api } from '@/lib/api'
import { toast } from '@/components/toast/Toaster.jsx'

const AuthCtx = createContext({
  user: null,
  loading: true,
  login: async (_u, _p) => {},
  register: async (_u, _p) => {},
  logout: async () => {},
  setUser: () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  // подтягиваем текущего пользователя по cookie
  React.useEffect(() => {
    let ignore = false
    api
      .me()
      .then((res) => !ignore && setUser(res?.user ?? null))
      .catch(() => !ignore && setUser(null))
      .finally(() => !ignore && setLoading(false))
    return () => (ignore = true)
  }, [])

  async function login(username, password) {
    const res = await api.auth.login(username, password)
    setUser(res.user)
    toast.success('С возвращением!')
    return res.user
  }

  async function register(username, password) {
    const res = await api.auth.register(username, password)
    setUser(res.user)
    toast.success('Аккаунт создан')
    return res.user
  }

  async function logout() {
    try {
      await api.auth.logout()
    } finally {
      setUser(null)
    }
    toast.info('Вы вышли')
  }

  const value = { user, setUser, loading, login, register, logout }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  return useContext(AuthCtx)
}
