import React from 'react'
import { useNavigate } from 'react-router-dom'
import { post } from '../../lib/api'

export default function RegisterForm() {
  const nav = useNavigate()
  const [username, setUsername] = React.useState('')
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
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов')
      return
    }
    setLoading(true)
    try {
      await post('/api/register', { username: username.trim(), password })
      // Успех: перенаправляем на логин (или автологин — можно включить при желании)
      nav('/login', { replace: true, state: { justRegistered: username.trim() } })
    } catch (e) {
      if (e.status === 409 || e.code === 'username_taken' || /занято/i.test(e.message || '')) {
        setError('Имя пользователя уже занято')
      } else if (e.status === 422) {
        setError('Проверьте корректность полей')
      } else if (e.code === 'network') {
        setError('Нет соединения с сервером')
      } else {
        setError('Не удалось создать аккаунт')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass p-6 rounded-2xl max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Регистрация</h2>
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
          autoComplete="new-password"
        />
        <button disabled={loading} className="btn btn-primary disabled:opacity-60">
          {loading ? 'Создаём…' : 'Создать аккаунт'}
        </button>
      </div>
      <div className="mt-3 text-sm text-white/60">
        Уже есть аккаунт?{' '}
        <a href="/login" className="underline">
          Войти
        </a>
      </div>
    </form>
  )
}
