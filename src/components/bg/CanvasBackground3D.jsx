import React from 'react'

/**
 * Анимированный «liquid glass / bokeh» фон.
 * Автоподхват акцентного цвета из CSS-переменных:
 *   --accent-hue, --accent-sat, --accent-light
 */
export default function CanvasBackground3D() {
  const ref = React.useRef(null)
  const rafRef = React.useRef(0)
  const st = React.useRef({
    w: 0,
    h: 0,
    dpr: 1,
    t: 0,
    mouseX: 0.5,
    mouseY: 0.5,
    hue: 160,
    sat: 70,
    light: 62,
    blobs: [],
  })

  /* ---------- helpers ---------- */
  const readAccent = React.useCallback(() => {
    const cs = getComputedStyle(document.documentElement)
    st.current.hue = parseFloat(cs.getPropertyValue('--accent-hue')) || 160
    st.current.sat = parseFloat(cs.getPropertyValue('--accent-sat')) || 70
    st.current.light = parseFloat(cs.getPropertyValue('--accent-light')) || 62
  }, [])

  const resize = React.useCallback(() => {
    const canvas = ref.current
    if (!canvas) return
    // жёстко занимаем весь вьюпорт, чтобы не было «маленького прямоугольника»
    canvas.style.width = '100vw'
    canvas.style.height = '100vh'
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    st.current.dpr = dpr
    st.current.w = window.innerWidth
    st.current.h = window.innerHeight
    canvas.width = Math.round(st.current.w * dpr)
    canvas.height = Math.round(st.current.h * dpr)
  }, [])

  const spawn = React.useCallback((count) => {
    const s = st.current
    const arr = []
    for (let i = 0; i < count; i++) {
      const r = 60 + Math.random() * 180
      arr.push({
        x: Math.random() * s.w,
        y: Math.random() * s.h,
        r,
        vx: (Math.random() * 2 - 1) * 0.15,
        vy: (Math.random() * 2 - 1) * 0.15,
        z: 0.4 + Math.random() * 0.6,
        o: 0.18 + Math.random() * 0.18,
      })
    }
    s.blobs = arr
  }, [])

  const hsl = (h, s, l, a = 1) => `hsl(${h} ${s}% ${l}% / ${a})`

  const draw = React.useCallback(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    const s = st.current
    const { w, h, dpr } = s

    s.t += 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    // цвета от акцента
    const base = s.hue,
      sat = s.sat
    const c1 = hsl(base, sat, Math.min(85, s.light + 12), 0.22)
    const c2 = hsl((base + 24) % 360, sat, Math.min(82, s.light + 8), 0.18)
    const c3 = hsl((base + 320) % 360, sat, Math.max(45, s.light - 10), 0.16)

    // мягкие большие пятна
    const g1 = ctx.createRadialGradient(
      w * 0.2,
      -h * 0.1,
      Math.min(w, h) * 0.2,
      w * 0.4,
      h * 0.3,
      Math.max(w, h) * 0.9,
    )
    g1.addColorStop(0, c1)
    g1.addColorStop(1, 'transparent')
    ctx.fillStyle = g1
    ctx.fillRect(0, 0, w, h)

    const g2 = ctx.createRadialGradient(
      w * 1.1,
      h * 0.4,
      Math.min(w, h) * 0.15,
      w * 0.8,
      h * 0.6,
      Math.max(w, h) * 0.8,
    )
    g2.addColorStop(0, c2)
    g2.addColorStop(1, 'transparent')
    ctx.fillStyle = g2
    ctx.fillRect(0, 0, w, h)

    const g3 = ctx.createRadialGradient(
      w * 0.5,
      h * 1.1,
      Math.min(w, h) * 0.2,
      w * 0.5,
      h * 0.9,
      Math.max(w, h) * 0.9,
    )
    g3.addColorStop(0, c3)
    g3.addColorStop(1, 'transparent')
    ctx.fillStyle = g3
    ctx.fillRect(0, 0, w, h)

    // пузырьки
    for (const b of s.blobs) {
      b.x += b.vx + (s.mouseX - 0.5) * 0.06 * b.z
      b.y += b.vy + (s.mouseY - 0.5) * 0.06 * b.z
      if (b.x < -200) b.x = w + 200
      if (b.x > w + 200) b.x = -200
      if (b.y < -200) b.y = h + 200
      if (b.y > h + 200) b.y = -200

      const gg = ctx.createRadialGradient(b.x, b.y, b.r * 0.2, b.x, b.y, b.r)
      gg.addColorStop(0, hsl((base + 15) % 360, sat, 70, b.o))
      gg.addColorStop(1, 'transparent')
      ctx.fillStyle = gg
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx.fill()
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [])

  React.useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    readAccent()
    resize()
    spawn(
      Math.round(
        16 * Math.min(1.5, Math.max(0.8, (window.innerWidth * window.innerHeight) / (1280 * 800))),
      ),
    )

    const onMove = (e) => {
      const s = st.current
      if ('touches' in e && e.touches.length) {
        s.mouseX = e.touches[0].clientX / window.innerWidth
        s.mouseY = e.touches[0].clientY / window.innerHeight
      } else {
        s.mouseX = e.clientX / window.innerWidth
        s.mouseY = e.clientY / window.innerHeight
      }
    }
    const onResize = () => resize()

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })

    // реагируем на смену темы/акцента
    const mo = new MutationObserver(() => {
      readAccent()
    })
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class', 'data-theme'],
    })

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('resize', onResize)
      mo.disconnect()
    }
  }, [draw, readAccent, resize, spawn])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none block"
      style={{
        width: '100vw',
        height: '100vh',
        filter: 'saturate(120%)',
        opacity: 0.9,
      }}
    />
  )
}
