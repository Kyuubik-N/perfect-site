import React from 'react'
import { useTranslation } from 'react-i18next'
import { Routes, Route, useLocation, Link } from 'react-router-dom'
import { CSSTransition, SwitchTransition } from 'react-transition-group'

const NotesPage = React.lazy(() => import('./pages/Notes'))
const CalendarPage = React.lazy(() => import('./pages/Calendar'))
const LibraryPage = React.lazy(() => import('./pages/Library'))
const FilesPage = React.lazy(() => import('./pages/Files'))
const CatalogPage = React.lazy(() => import('./pages/Catalog'))
const LoginPage = React.lazy(() => import('./pages/Login'))
const RegisterPage = React.lazy(() => import('./pages/Register'))
const SettingsPage = React.lazy(() => import('./pages/Settings'))

import Navbar from './components/Navbar'
import GlassCard from './components/GlassCard'
import CanvasBackground3D from './components/bg/CanvasBackground3D'
import RouteEffects from './navigation/RouteEffects'
import MobileDock from './components/MobileDock'
import Breadcrumbs from './components/Breadcrumbs'
import useGlobalHotkeys from './hooks/useGlobalHotkeys'

function HomeSection({ t }) {
  return (
    <section className="container-wide px-6 py-16">
      <div className="max-w-3xl">
        <h1 className="heading text-4xl sm:text-5xl gradient-text">
          {t('home.heroTitle', { defaultValue: 'Kyuubik — личное пространство' })}
        </h1>
        <p className="mt-4 text-lg text-fg/80">
          {t('home.heroSubtitle', {
            defaultValue: 'Заметки, календарь и файлы — быстро и красиво.',
          })}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/notes" className="btn btn-primary">
            Открыть заметки
          </Link>
          <Link to="/files" className="btn">
            К файлам
          </Link>
        </div>
      </div>

      <div className="mt-10 grid sm:grid-cols-2 gap-6">
        <GlassCard className="p-5">
          <div className="text-fg-strong">Быстрые действия</div>
          <div className="mt-3 flex gap-2 flex-wrap">
            <Link to="/notes" className="glass-button">
              + Заметка
            </Link>
            <Link to="/files" className="glass-button">
              + Ссылка
            </Link>
            <Link to="/library" className="glass-button">
              Библиотека
            </Link>
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="text-fg-strong">Советы</div>
          <p className="mt-2 text-sm text-fg/75">
            <b>Alt</b>+<b>1..6</b> — быстрое переключение разделов.
            <b>g</b> затем <b>h/c/n/f/s</b> — «go to».
            <b>/</b> — фокус на поиск.
          </p>
        </GlassCard>
      </div>
    </section>
  )
}

function NotFound() {
  return <div className="container-wide px-6 py-24 text-fg/75">Страница не найдена</div>
}

export default function App() {
  const { t } = useTranslation()
  const location = useLocation()
  useGlobalHotkeys()

  React.useEffect(() => {
    const p = (location.pathname || '/').replace(/\/+$/, '') || '/'
    const suffix = 'Kyuubik'
    const map = {
      '/': t('home.heroTitle', { defaultValue: suffix }) || suffix,
      '/notes': 'Заметки — ' + suffix,
      '/calendar': 'Календарь — ' + suffix,
      '/catalog': 'Каталог — ' + suffix,
      '/files': 'Файлы — ' + suffix,
      '/library': 'Библиотека — ' + suffix,
      '/settings': 'Настройки — ' + suffix,
      '/login': 'Вход — ' + suffix,
      '/register': 'Регистрация — ' + suffix,
    }
    document.title = map[p] || suffix
  }, [location.pathname, t])

  return (
    <>
      <CanvasBackground3D />
      <a href="#content" className="skip-link">
        Пропустить к контенту
      </a>
      <Navbar />
      <Breadcrumbs />

      <a className="footer-badge" href="https://vitejs.dev/" target="_blank" rel="noreferrer">
        Сделано с <span className="mx-1">❤️</span> на Vite + React + Tailwind
      </a>

      <main id="content" className="pt-6 min-h-[70vh]" tabIndex={-1}>
        <RouteEffects />
        <React.Suspense fallback={<div className="container-wide pt-32 text-fg/70">Загрузка…</div>}>
          <SwitchTransition>
            <CSSTransition key={location.pathname} timeout={350} classNames="page" unmountOnExit>
              <Routes location={location}>
                <Route path="/" element={<HomeSection t={t} />} />
                <Route path="/notes" element={<NotesPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/files" element={<FilesPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </CSSTransition>
          </SwitchTransition>
        </React.Suspense>
      </main>

      {/* мобильный док для маленьких экранов */}
      <MobileDock />
    </>
  )
}
