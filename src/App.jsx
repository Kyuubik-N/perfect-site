import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Routes, Route, useLocation } from 'react-router-dom'
import { CSSTransition, SwitchTransition } from 'react-transition-group'
const NotesPage = React.lazy(() => import('./pages/Notes'))
const CalendarPage = React.lazy(() => import('./pages/Calendar'))
const LibraryPage = React.lazy(() => import('./pages/Library'))
const FilesPage = React.lazy(() => import('./pages/Files'))
const CatalogPage = React.lazy(() => import('./pages/Catalog'))
const LoginPage = React.lazy(() => import('./pages/Login'))
const RegisterPage = React.lazy(() => import('./pages/Register'))
import Navbar from './components/Navbar'
import LiquidField from './components/LiquidField'
import GlassCard from './components/GlassCard'
import GlassButton from './components/GlassButton'
import ErrorBoundary from './components/ErrorBoundary'

function ThemeToggle() {
  const [dark, setDark] = React.useState(() => document.documentElement.classList.contains('dark'))

  const toggle = () => {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }
  return (
    <button
      onClick={toggle}
      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {dark ? '🌙' : '☀️'}
    </button>
  )
}

function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const change = (lng) => i18n.changeLanguage(lng)
  const active = i18n.language?.startsWith('ru') ? 'ru' : 'en'
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
      {['en', 'ru'].map((lng) => (
        <button
          key={lng}
          onClick={() => change(lng)}
          className={`px-2 py-1 rounded-md text-sm transition ${
            active === lng
              ? 'bg-sky-500 text-white'
              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5'
          }`}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

function HomeSection({ t }) {
  return (
    <>
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="glass p-8 md:p-12">
          <div className="text-sm uppercase tracking-wide text-white/60">Personal cloud</div>
          <h1 className="gradient-text heading text-4xl sm:text-5xl font-bold mt-2">
            {t('home.heroTitle')}
          </h1>
          <p className="mt-4 text-white/80 max-w-2xl">{t('home.heroSubtitle')}</p>
          <div className="mt-6 flex items-center gap-3">
            <Link to="/notes" className="glass-button inline-flex items-center gap-2 shadow-glass">
              📝 {t('home.ctaPrimary')}
            </Link>
            <Link to="/library" className="glass-button inline-flex items-center shadow-glass">
              📁 {t('home.ctaSecondary')}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

export default function App() {
  const { t } = useTranslation()
  const location = useLocation()
  const [ornaments, setOrnaments] = React.useState(() => {
    try {
      const saved = localStorage.getItem('ornaments')
      return saved ? saved === 'on' : true
    } catch {
      return true
    }
  })

  React.useEffect(() => {
    try {
      localStorage.setItem('ornaments', ornaments ? 'on' : 'off')
    } catch {}
  }, [ornaments])

  // Dynamic page title by route + language
  React.useEffect(() => {
    const p = location.pathname.replace(/\/+$/, '') || '/'
    const suffix = 'Kyuubik'
    const map = {
      '/': t('home.heroTitle') || suffix,
      '/notes': 'Заметки — ' + suffix,
      '/calendar': 'Календарь — ' + suffix,
      '/catalog': 'Каталог — ' + suffix,
      '/files': 'Файлы — ' + suffix,
      '/login': 'Вход — ' + suffix,
      '/register': 'Регистрация — ' + suffix,
    }
    document.title = map[p] || suffix
  }, [location.pathname, t])

  const OrnamentsToggle = () => (
    <button
      onClick={() => setOrnaments((v) => !v)}
      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition"
      aria-pressed={ornaments}
      title="Toggle background ornaments"
    >
      {ornaments ? '✨ On' : '✨ Off'}
    </button>
  )

  const BackgroundOrnaments = () => (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Top-left blob */}
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-sky-400 via-indigo-400 to-fuchsia-400 opacity-30 dark:opacity-20 blur-3xl will-change-transform motion-safe:animate-blob"></div>
      {/* Right big blob */}
      <div className="absolute top-1/4 -right-28 h-96 w-96 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 opacity-25 dark:opacity-15 blur-[90px] will-change-transform motion-safe:animate-blob2 animation-delay-2000"></div>
      {/* Bottom center blob */}
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-gradient-to-tr from-rose-400 via-orange-400 to-amber-400 opacity-20 dark:opacity-10 blur-3xl will-change-transform motion-safe:animate-blob3 animation-delay-4000"></div>
      {/* Soft vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_10%,rgba(255,255,255,0.65),transparent_60%)] dark:bg-[radial-gradient(80%_50%_at_50%_10%,rgba(255,255,255,0.04),transparent_60%)]"></div>

      {/* Pastel green background container */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-32 left-10 w-80 h-80 bg-pastel-mint rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pastel-green rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-spin-slow"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-glass-bg rounded-3xl mix-blend-overlay filter blur-2xl opacity-30 animate-bounce"></div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col no-tap-highlight text-white/90 relative z-0">
      <Navbar />
      <LiquidField />
      <div className="veil" />

      {/* Живые blob-орнаменты включены */}
      {ornaments && <BackgroundOrnaments />}

      <main id="main" className="container-wide px-4 pt-28 pb-20 relative z-10">
        <ErrorBoundary>
          <SwitchTransition mode="out-in">
            <CSSTransition key={location.pathname} classNames="page" timeout={350}>
              <div>
                <React.Suspense
                  fallback={<div className="text-white/60 animate-pulse">Загрузка…</div>}
                >
                  <Routes location={location}>
                    <Route path="/" element={<HomeSection t={t} />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/notes" element={<NotesPage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/catalog" element={<CatalogPage />} />
                    <Route path="/library" element={<LibraryPage />} />
                    <Route path="/files" element={<FilesPage />} />
                    <Route
                      path="*"
                      element={<div className="text-white/70">Страница не найдена</div>}
                    />
                  </Routes>
                </React.Suspense>
              </div>
            </CSSTransition>
          </SwitchTransition>
        </ErrorBoundary>
      </main>

      <footer id="contact" className="mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-slate-600 dark:text-slate-400">
          {t('footer.madeBy')}
        </div>
      </footer>
    </div>
  )
}
