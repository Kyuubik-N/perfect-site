import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { useToast } from '../toast/Toaster'

export default function RegisterForm() {
  const { register } = useAuth()
  const { toast } = useToast()
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [p2, setP2] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (p !== p2) return setErr('Пароли не совпадают')
    if (p.length < 6) return setErr('Минимум 6 символов')
    setBusy(true)
    setErr('')
    try {
      await register(u, p)
      toast('Аккаунт создан ✅')
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
      <h2 className="heading text-2xl">Регистрация</h2>
      {err && <div className="text-red-400 text-sm">{err}</div>}
      <form onSubmit={submit} className="space-y-3">
        <Input placeholder="Логин" value={u} onChange={(e) => setU(e.target.value)} />
        <Input
          type="password"
          placeholder="Пароль"
          value={p}
          onChange={(e) => setP(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Повтор пароля"
          value={p2}
          onChange={(e) => setP2(e.target.value)}
        />
        <Button variant="primary" type="submit" disabled={busy} className="w-full">
          {busy ? 'Создаём…' : 'Создать аккаунт'}
        </Button>
      </form>
      <div className="text-sm text-white/60">
        Есть аккаунт?{' '}
        <a href="/login" className="underline">
          Войти
        </a>
      </div>
    </Card>
  )
}
