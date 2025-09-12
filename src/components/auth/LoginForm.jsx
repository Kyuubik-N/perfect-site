import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { post } from '../../lib/api'

export default function LoginForm() {
  const nav = useNavigate()
  const loc = useLocation()
  const [username, setUsername] = React.useState(loc.state?.justRegistered || '')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !password.trim()) {
      setError('Введите логин и пароль')
      return
    }
    setLoading(true)
    try {
      await post('/api/login', { username: username.trim(), password })
      // Сервер ставит cookie — просто уводим на главную
      nav('/', { replace: true })
      // можно добавить глобальный refetch профиля, если есть such контекст
    } catch (e) {
      if (e.status === 401) setError('Неверный логин или пароль')
      else if (e.code === 'network') setError('Нет соединения с сервером')
      else setError('Не удалось войти')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass p-6 rounded-2xl max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Вход</h2>
      {error && <div className="mb-3 text-sm text-red-300">{error}</div>}
      <div className="grid gap-3">
        <input
          className="input"
          placeholder="Логин"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <input
          className="input"
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button disabled={loading} className="btn btn-primary disabled:opacity-60">
          {loading ? 'Входим…' : 'Войти'}
        </button>
      </div>
    </form>
  )
}
