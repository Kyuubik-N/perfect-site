import React from 'react'

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const sysPrefersDark = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: dark)').matches

function useLS(key, initial) {
  const [val, setVal] = React.useState(() => {
    try {
      const s = localStorage.getItem(key)
      return s != null ? JSON.parse(s) : initial
    } catch {
      return initial
    }
  })
  React.useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val))
    } catch {}
  }, [key, val])
  return [val, setVal]
}

function hslToHex(h, s, l) {
  s /= 100
  l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let [r, g, b] = [0, 0, 0]
  if (0 <= h && h < 60) [r, g, b] = [c, x, 0]
  else if (60 <= h && h < 120) [r, g, b] = [x, c, 0]
  else if (120 <= h && h < 180) [r, g, b] = [0, c, x]
  else if (180 <= h && h < 240) [r, g, b] = [0, x, c]
  else if (240 <= h && h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const toHex = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
function hexToHsl(hex) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (!m) return { h: 160, s: 70, l: 62 }
  let r = parseInt(m[1], 16) / 255
  let g = parseInt(m[2], 16) / 255
  let b = parseInt(m[3], 16) / 255
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b)
  let h,
    s,
    l = (max + min) / 2
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h *= 60
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

const SWATCHES = [
  { h: 160, s: 70 },
  { h: 200, s: 70 },
  { h: 255, s: 70 },
  { h: 300, s: 75 },
  { h: 20, s: 90 },
  { h: 340, s: 70 },
  { h: 45, s: 85 },
  { h: 125, s: 70 },
]

export default function ThemeDesigner() {
  const [hue, setHue] = useLS('accent_hue', 160)
  const [sat, setSat] = useLS('accent_sat', 70)
  const [light, setLight] = useLS('accent_light', 62)
  const [intensity, setIntensity] = useLS('bg_intensity', 1)
  const [radius, setRadius] = useLS('ui_radius', 20)
  const [blur, setBlur] = useLS('glass_blur', 24)
  const [mode, setMode] = useLS('theme_mode', 'auto') // по умолчанию Auto

  // применяем CSS-переменные
  React.useEffect(() => {
    const r = document.documentElement
    r.style.setProperty('--accent-hue', String(hue))
    r.style.setProperty('--accent-sat', String(sat))
    r.style.setProperty('--accent-light', String(light))
    r.style.setProperty('--bg-intensity', String(intensity))
    r.style.setProperty('--radius', `${radius}px`)
    r.style.setProperty('--glass-blur', `${blur}px`)
  }, [hue, sat, light, intensity, radius, blur])

  // режим темы
  const applyMode = React.useCallback(
    (m) => {
      setMode(m)
      const root = document.documentElement
      if (m === 'auto') {
        try {
          localStorage.removeItem('theme')
        } catch {}
        const dark = sysPrefersDark()
        root.classList.toggle('dark', dark)
        root.setAttribute('data-theme', dark ? 'dark' : 'light')
      } else {
        try {
          localStorage.setItem('theme', m)
        } catch {}
        root.classList.toggle('dark', m === 'dark')
        root.setAttribute('data-theme', m)
      }
    },
    [setMode],
  )

  React.useEffect(() => {
    applyMode(mode)
  }, []) // init once
  React.useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (mode === 'auto') applyMode('auto')
    }
    mq?.addEventListener?.('change', onChange)
    return () => mq?.removeEventListener?.('change', onChange)
  }, [mode, applyMode])

  // площадка цвета
  const padRef = React.useRef(null)
  const [drag, setDrag] = React.useState(false)
  const point = (e) => {
    const el = padRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = clamp((('touches' in e ? e.touches[0].clientX : e.clientX) - r.left) / r.width, 0, 1)
    const y = clamp((('touches' in e ? e.touches[0].clientY : e.clientY) - r.top) / r.height, 0, 1)
    setHue(Math.round(x * 360))
    setSat(Math.round(30 + y * 70))
  }

  const reset = () => {
    setHue(160)
    setSat(70)
    setLight(62)
    setIntensity(1)
    setRadius(20)
    setBlur(24)
  }
  const randomize = () => {
    setHue(Math.floor(Math.random() * 360))
    setSat(40 + Math.floor(Math.random() * 55))
    setLight(55 + Math.floor(Math.random() * 20))
  }

  return (
    <div className="glass p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium text-fg-strong">Дизайнер темы</div>
        <div className="segmented">
          <button
            className={mode === 'auto' ? 'is-active' : ''}
            title="Авто"
            onClick={() => applyMode('auto')}
          >
            ⎋
          </button>
          <button
            className={mode === 'light' ? 'is-active' : ''}
            title="Светлая"
            onClick={() => applyMode('light')}
          >
            ☀️
          </button>
          <button
            className={mode === 'dark' ? 'is-active' : ''}
            title="Тёмная"
            onClick={() => applyMode('dark')}
          >
            🌙
          </button>
        </div>
      </div>

      <div
        ref={padRef}
        className="theme-pad"
        style={{
          background: `linear-gradient(0deg, hsl(${hue} ${sat}% 60% / .6), hsl(${hue} ${sat}% 60% / .15))`,
        }}
        onMouseDown={(e) => {
          setDrag(true)
          point(e)
        }}
        onMouseMove={(e) => drag && point(e)}
        onMouseUp={() => setDrag(false)}
        onMouseLeave={() => setDrag(false)}
        onTouchStart={(e) => {
          setDrag(true)
          point(e)
        }}
        onTouchMove={(e) => drag && point(e)}
        onTouchEnd={() => setDrag(false)}
      >
        <div
          className="theme-dot"
          style={{
            left: `${(hue / 360) * 100}%`,
            top: `${((sat - 30) / 70) * 100}%`,
            backgroundColor: `hsl(${hue} ${sat}% ${light}%)`,
          }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {SWATCHES.map((p, i) => (
          <button
            key={i}
            className="swatch"
            style={{ backgroundColor: `hsl(${p.h} ${p.s}% 60%)` }}
            onClick={() => {
              setHue(p.h)
              setSat(p.s)
            }}
          />
        ))}
        <input
          type="color"
          className="swatch swatch-picker"
          value={hslToHex(hue, sat, light)}
          onChange={(e) => {
            const { h, s, l } = hexToHsl(e.target.value)
            setHue(h)
            setSat(s)
            setLight(l)
          }}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">
            Яркость акцента: <b>{light}%</b>
          </label>
          <input
            className="slider"
            type="range"
            min="30"
            max="80"
            value={light}
            onChange={(e) => setLight(+e.target.value)}
          />
        </div>
        <div>
          <label className="label">
            Интенсивность фона: <b>{intensity.toFixed(1)}</b>
          </label>
          <input
            className="slider"
            type="range"
            min="0.6"
            max="1.6"
            step="0.1"
            value={intensity}
            onChange={(e) => setIntensity(+e.target.value)}
          />
        </div>
        <div>
          <label className="label">
            Скругление углов: <b>{radius}px</b>
          </label>
          <input
            className="slider"
            type="range"
            min="8"
            max="28"
            step="1"
            value={radius}
            onChange={(e) => setRadius(+e.target.value)}
          />
        </div>
        <div>
          <label className="label">
            Размытие стекла: <b>{blur}px</b>
          </label>
          <input
            className="slider"
            type="range"
            min="8"
            max="36"
            step="1"
            value={blur}
            onChange={(e) => setBlur(+e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="glass p-4 rounded-2xl">
          <div className="text-fg-strong mb-3">Превью элементов</div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-primary">Кнопка</button>
            <button className="btn">Вторичная</button>
            <input className="input" placeholder="Инпут" style={{ width: 180 }} />
          </div>
        </div>
        <div className="glass p-4 rounded-2xl flex flex-wrap gap-2 items-center">
          <button className="glass-button" onClick={reset}>
            Сброс
          </button>
          <button className="glass-button" onClick={randomize}>
            Случайно
          </button>
          <div className="ml-auto text-sm muted">
            H:{hue} S:{sat}% L:{light}% • R:{radius}px • B:{blur}px
          </div>
        </div>
      </div>
    </div>
  )
}
