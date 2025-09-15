import React from 'react'

export default function CanvasBackground3D() {
  const ref = React.useRef(null)

  React.useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    let raf, w, h
    const blobs = Array.from({ length: 6 }).map(() => ({
      x: Math.random(),
      y: Math.random(),
      r: 60 + Math.random() * 120,
      vx: (Math.random() - 0.5) * 0.0015,
      vy: (Math.random() - 0.5) * 0.0015,
    }))

    const onResize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    onResize()
    window.addEventListener('resize', onResize)

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h)
      ctx.save()
      ctx.globalAlpha = 0.6
      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i]
        b.x += b.vx
        b.y += b.vy
        if (b.x < 0 || b.x > 1) b.vx *= -1
        if (b.y < 0 || b.y > 1) b.vy *= -1
        const cx = b.x * w,
          cy = b.y * h
        const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, b.r * 2.2)
        grad.addColorStop(0, 'rgba(79,212,166,0.35)')
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(cx, cy, b.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return <canvas ref={ref} className="fixed inset-0 -z-10 pointer-events-none" />
}
