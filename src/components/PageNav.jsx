import React from 'react'

export default function PageNav({ sections = [] }) {
  const [active, setActive] = React.useState(sections[0]?.id)

  React.useEffect(() => {
    if (!sections.length) return
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && setActive(en.target.id)),
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.01, 0.5, 1] },
    )
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [sections])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (!sections.length) return null

  return (
    <aside className="page-nav hidden lg:block">
      <div className="page-nav-inner">
        {sections.map((s, i) => (
          <button
            key={s.id}
            className={'page-nav-item ' + (active === s.id ? 'is-active' : '')}
            onClick={() => scrollTo(s.id)}
            type="button"
            aria-current={active === s.id ? 'true' : 'false'}
          >
            <span className="dot" />
            <span className="label">{s.title}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
