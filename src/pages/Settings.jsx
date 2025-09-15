import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext.jsx'
import { toast } from '@/components/toast/Toaster.jsx'
import { api } from '@/lib/api'

function setTheme(theme) {
  try {
    if (theme === 'system') {
      localStorage.removeItem('theme')
      const m = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', m)
    } else {
      localStorage.setItem('theme', theme)
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
  } catch {}
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const [theme, setThemeState] = React.useState(localStorage.getItem('theme') || 'system')
  const [apiOk, setApiOk] = React.useState(null)

  React.useEffect(() => {
    api
      .ping()
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false))
  }, [])

  function onThemeChange(e) {
    const v = e.target.value
    setThemeState(v)
    setTheme(v)
    toast.info(v === 'dark' ? 'Тёмная тема' : v === 'light' ? 'Светлая тема' : 'Системная тема')
  }

  async function onLangChange(e) {
    const lng = e.target.value
    await i18n.changeLanguage(lng)
    toast.success(lng === 'ru' ? 'Язык: Русский' : 'Language set: English')
  }

  async function onLogout() {
    await logout()
  }

  async function doExport() {
    try {
      const data = await api.data.export()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      a.href = url
      a.download = `kyuubik-export-${stamp}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Экспорт готов')
    } catch {
      toast.error('Не удалось экспортировать')
    }
  }

  async function doImport(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const res = await api.data.import(json)
      toast.success(
        `Импортировано: заметок ${res.imported?.notes || 0}, файлов ${res.imported?.files || 0}`,
      )
    } catch {
      toast.error('Импорт не удался')
    }
  }

  return (
    <div className="container-wide px-6 py-10" id="main">
      <h1 className="text-2xl font-semibold">
        {t('settings.title', { defaultValue: 'Настройки' })}
      </h1>

      <div className="mt-6 grid gap-6">
        <section className="rounded-2xl bg-glass-bg backdrop-blur-xs p-5">
          <div className="font-medium">Аккаунт</div>
          <div className="mt-2 text-fg/80">
            {user ? (
              <>
                <div>
                  Пользователь: <b>{user.username}</b>
                </div>
                <div className="text-sm mt-1">
                  Статус API: {apiOk === null ? '—' : apiOk ? 'OK' : 'Ошибка'}
                </div>
                <button onClick={onLogout} className="mt-4 btn btn-ghost">
                  Выйти
                </button>
              </>
            ) : (
              <div className="text-sm">Вы не авторизованы</div>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-glass-bg backdrop-blur-xs p-5">
          <div className="font-medium">Оформление</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="theme"
                value="system"
                checked={theme === 'system'}
                onChange={onThemeChange}
              />
              Системная
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={onThemeChange}
              />
              Светлая
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={onThemeChange}
              />
              Тёмная
            </label>
          </div>
        </section>

        <section className="rounded-2xl bg-glass-bg backdrop-blur-xs p-5">
          <div className="font-medium">Язык</div>
          <div className="mt-3">
            <select
              className="input max-w-xs"
              defaultValue={i18n.language?.startsWith('ru') ? 'ru' : 'en'}
              onChange={onLangChange}
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
        </section>

        <section className="rounded-2xl bg-glass-bg backdrop-blur-xs p-5">
          <div className="font-medium">Данные</div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button className="btn btn-primary" onClick={doExport}>
              Экспорт JSON
            </button>
            <label className="btn btn-ghost cursor-pointer">
              Импорт JSON
              <input type="file" accept="application/json" hidden onChange={doImport} />
            </label>
          </div>
          <p className="text-sm text-fg/70 mt-2">
            Экспорт включает «Заметки» и «Файлы» (с тегами). Импорт добавляет записи к текущим.
          </p>
        </section>
      </div>
    </div>
  )
}
