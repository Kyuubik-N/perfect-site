import React from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext.jsx'

export default function RegisterPage() {
  const { register } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const [form, setForm] = React.useState({ username: '', password: '', password2: '' })
  const [loading, setLoading] = React.useState(false)
  const from = location.state?.from || '/'

  async function onSubmit(e) {
    e.preventDefault()
    if (!form.username.trim() || !form.password.trim()) return
    if (form.password !== form.password2) return alert('Пароли не совпадают')
    setLoading(true)
    try {
      await register(form.username.trim(), form.password)
      nav(from, { replace: true })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-wide px-6 py-16" id="main">
      <h1 className="text-2xl font-semibold">Регистрация</h1>

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
          autoComplete="new-password"
        />
        <input
          className="input"
          type="password"
          placeholder="Повторите пароль"
          value={form.password2}
          onChange={(e) => setForm((f) => ({ ...f, password2: e.target.value }))}
          autoComplete="new-password"
        />
        <button className="btn btn-primary" disabled={loading}>
          {loading ? 'Создаём…' : 'Создать аккаунт'}
        </button>
      </form>

      <p className="mt-4 text-sm text-fg/70">
        Уже есть аккаунт?{' '}
        <Link className="underline" to="/login" state={{ from }}>
          Войти
        </Link>
      </p>
    </div>
  )
}
