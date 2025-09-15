import React from 'react'
import { useTranslation } from 'react-i18next'
import { Routes, Route, useLocation, Link } from 'react-router-dom'
import { CSSTransition, SwitchTransition } from 'react-transition-group'

// pages
const NotesPage = React.lazy(() => import('./pages/Notes'))
const CalendarPage = React.lazy(() => import('./pages/Calendar'))
const LibraryPage = React.lazy(() => import('./pages/Library'))
const FilesPage = React.lazy(() => import('./pages/Files'))
const CatalogPage = React.lazy(() => import('./pages/Catalog'))
const LoginPage = React.lazy(() => import('./pages/Login'))
const RegisterPage = React.lazy(() => import('./pages/Register'))
const SettingsPage = React.lazy(() => import('./pages/Settings'))

// components
import Navbar from './components/Navbar'
import GlassCard from './components/GlassCard'
import CanvasBackground3D from './components/bg/CanvasBackground3D'
import RouteEffects from './navigation/RouteEffects'
import MobileDock from './components/MobileDock'
import Breadcrumbs from './components/Breadcrumbs'
import useGlobalHotkeys from './hooks/useGlobalHotkeys'
import Footer from './components/Footer'
import Toaster from '@/components/toast/Toaster.jsx'
import Protected from '@/components/Protected.jsx'

function HomeSection({ t }) {
  return (
    <section className="container-wide px-6 py-16" id="main">
      <div className="max-w-3xl">
        <h1 className="text-4xl sm:text-5xl font-semibold gradient-text">
          {t('home.heroTitle', { defaultValue: 'Kyuubik — личное пространство' })}
        </h1>
        <p className="mt-4 text-lg opacity-85">
          {t('home.heroSubtitle', {
            defaultValue: 'Заметки, календарь и файлы — быстро и красиво.',
          })}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/notes" className="btn btn-primary">
            Открыть заметки
          </Link>
          <Link to="/files" className="btn btn-ghost">
            К файлам
          </Link>
        </div>
      </div>

      <div className="mt-10 grid sm:grid-cols-2 gap-6">
        <GlassCard className="p-5">
          <div className="text-base font-medium">Быстрые действия</div>
          <div className="hr"></div>
          <div className="mt-3 flex gap-2 flex-wrap">
            <Link to="/notes" className="btn btn-ghost">
              + Заметка
            </Link>
            <Link to="/files" className="btn btn-ghost">
              + Ссылка
            </Link>
            <Link to="/library" className="btn btn-ghost">
              Библиотека
            </Link>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="text-base font-medium">Советы</div>
          <div className="hr"></div>
          <p className="mt-3 text-sm opacity-80">
            Нажми <kbd>/</kbd> — фокус на поиск. <br />
            <kbd>Alt</kbd>+<kbd>1..6</kbd> — разделы. <br />
            <kbd>g</kbd> потом <kbd>h/c/n/f/s</kbd> — «go to».
          </p>
        </GlassCard>
      </div>
    </section>
  )
}

function NotFound() {
  return <div className="container-wide px-6 py-24 opacity-80">Страница не найдена</div>
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
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 btn btn-ghost"
      >
        Пропустить к контенту
      </a>

      <CanvasBackground3D />
      <Navbar />

      <div className="container-wide px-6 pt-4">
        <Breadcrumbs />
      </div>
      <RouteEffects />

      <React.Suspense
        fallback={
          <div className="container-wide px-6 py-16">
            <div className="card p-8 animate-pulse">Загрузка…</div>
          </div>
        }
      >
        <SwitchTransition>
          <CSSTransition key={location.pathname} classNames="fade" timeout={180}>
            <Routes location={location}>
              {/* public */}
              <Route path="/" element={<HomeSection t={t} />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* private */}
              <Route
                path="/notes"
                element={
                  <Protected>
                    <NotesPage />
                  </Protected>
                }
              />
              <Route
                path="/files"
                element={
                  <Protected>
                    <FilesPage />
                  </Protected>
                }
              />
              <Route
                path="/calendar"
                element={
                  <Protected>
                    <CalendarPage />
                  </Protected>
                }
              />
              <Route
                path="/library"
                element={
                  <Protected>
                    <LibraryPage />
                  </Protected>
                }
              />
              <Route
                path="/settings"
                element={
                  <Protected>
                    <SettingsPage />
                  </Protected>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CSSTransition>
        </SwitchTransition>
      </React.Suspense>

      <MobileDock />
      <Footer />
      <Toaster />
    </>
  )
}
