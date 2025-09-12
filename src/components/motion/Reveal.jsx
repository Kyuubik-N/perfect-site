import React from 'react'

/**
 * Reveal — оборачивает блок и плавно проявляет его при входе во вьюпорт.
 * Использует IntersectionObserver. Учитывает prefers-reduced-motion.
 */
export default function Reveal({
  as: Tag = 'div',
  className = '',
  threshold = 0.14,
  once = true,
  children,
}) {
  const ref = React.useRef(null)
  const [inview, setInview] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduce) {
      setInview(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInview(true)
            if (once) io.unobserve(el)
          } else if (!once) {
            setInview(false)
          }
        })
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [once, threshold])

  return (
    <Tag ref={ref} className={`reveal ${inview ? 'is-inview' : ''} ${className}`}>
      {children}
    </Tag>
  )
}
