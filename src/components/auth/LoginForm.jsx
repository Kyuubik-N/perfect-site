import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { useToast } from '../toast/Toaster'

export default function LoginForm() {
  const { login } = useAuth()
  const { toast } = useToast()
  const [username, setU] = useState('')
  const [password, setP] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await login(username, password)
      toast('Добро пожаловать 👋')
      window.location.assign('/')
    } catch (e) {
      const map = {
        user_exists: 'Логин занят',
        invalid_username: 'Логин слишком короткий',
        invalid_password: 'Пароль слишком короткий',
        invalid_credentials: 'Неверный логин или пароль',
        timeout: 'Сервер не отвечает (таймаут)',
        network: 'Сетевая ошибка',
        server_error: 'Ошибка сервера',
      }
      setErr(map[e.message] || e.message || 'Ошибка')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="max-w-sm mx-auto mt-24 space-y-4">
      <h2 className="heading text-2xl">Вход</h2>
      {err && <div className="text-red-400 text-sm">{err}</div>}
      <form onSubmit={submit} className="space-y-3">
        <Input placeholder="Логин" value={username} onChange={(e) => setU(e.target.value)} />
        <Input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setP(e.target.value)}
        />
        <Button variant="primary" type="submit" disabled={busy} className="w-full">
          {busy ? 'Входим…' : 'Войти'}
        </Button>
      </form>
      <div className="text-sm text-white/60">
        Нет аккаунта?{' '}
        <a href="/register" className="underline">
          Зарегистрируйтесь
        </a>
      </div>
    </Card>
  )
}
