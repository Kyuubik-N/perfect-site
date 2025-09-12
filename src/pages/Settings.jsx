import React from 'react'
import ThemeDesigner from '../components/settings/ThemeDesigner'
import TipsPanel from '../components/settings/TipsPanel'
import PageNav from '../components/PageNav'

export default function SettingsPage() {
  const sections = [
    { id: 'theme-designer', title: 'Дизайнер темы' },
    { id: 'tips', title: 'Советы' },
  ]

  return (
    <div className="container-wide px-4 sm:px-6 py-8 relative">
      <PageNav sections={sections} />

      <div className="grid lg:grid-cols-2 gap-6">
        <section id="theme-designer" className="anchor-offset" aria-labelledby="theme-title">
          <h2 id="theme-title" className="sr-only">
            Дизайнер темы
          </h2>
          <ThemeDesigner />
        </section>

        <section id="tips" className="anchor-offset" aria-labelledby="tips-title">
          <h2 id="tips-title" className="sr-only">
            Советы
          </h2>
          <TipsPanel />
        </section>
      </div>
    </div>
  )
}
