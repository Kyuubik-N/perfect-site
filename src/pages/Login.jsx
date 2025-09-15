import React from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const [form, setForm] = React.useState({ username: '', password: '' })
  const [loading, setLoading] = React.useState(false)
  const from = location.state?.from || '/'

  async function onSubmit(e) {
    e.preventDefault()
    if (!form.username.trim() || !form.password.trim()) return
    setLoading(true)
    try {
      await login(form.username.trim(), form.password)
      nav(from, { replace: true })
    } catch (e) {
      // сообщение уже придёт тостом из контекста, но можно продублировать
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-wide px-6 py-16" id="main">
      <h1 className="text-2xl font-semibold">Вход</h1>

      <form onSubmit={onSubmit} className="mt-6 max-w-md grid gap-3">
        <input
          className="input"
          placeholder="Имя пользователя"
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          autoComplete="username"
        />
        <input
          className="input"
          type="password"
          placeholder="Пароль"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          autoComplete="current-password"
        />
        <button className="btn btn-primary" disabled={loading}>
          {loading ? 'Входим…' : 'Войти'}
        </button>
      </form>

      <p className="mt-4 text-sm text-fg/70">
        Нет аккаунта?{' '}
        <Link className="underline" to="/register" state={{ from }}>
          Зарегистрироваться
        </Link>
      </p>
    </div>
  )
}
