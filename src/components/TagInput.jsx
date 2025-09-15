import React from 'react'

export default function TagInput({ value = [], onChange, suggestions = [], placeholder = 'теги' }) {
  const [text, setText] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const inputRef = React.useRef(null)

  const filtered = React.useMemo(() => {
    const q = text.trim().toLowerCase()
    if (!q) return suggestions.filter((s) => !value.includes(s)).slice(0, 8)
    return suggestions.filter((s) => s.includes(q) && !value.includes(s)).slice(0, 8)
  }, [text, suggestions, value])

  function add(tag) {
    const t = tag
      .toLowerCase()
      .trim()
      .replace(/[,\s]+/g, '-')
    if (!t || value.includes(t)) return
    onChange?.([...value, t])
    setText('')
    setOpen(false)
  }

  function remove(tag) {
    onChange?.(value.filter((x) => x !== tag))
  }

  function onKeyDown(e) {
    if (['Enter', 'Tab', ','].includes(e.key)) {
      e.preventDefault()
      if (text.trim()) add(text)
    } else if (e.key === 'Backspace' && !text && value.length) {
      remove(value[value.length - 1])
    }
  }

  function onPaste(e) {
    const str = e.clipboardData.getData('text')
    if (str.includes(',') || str.includes(' ')) {
      e.preventDefault()
      str
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach(add)
    }
  }

  return (
    <div className="rounded-xl bg-glass-bg backdrop-blur-xs px-2 py-1 flex flex-wrap gap-1 relative">
      {value.map((t) => (
        <span key={t} className="chip">
          #{t}
          <button type="button" onClick={() => remove(t)} className="chip-x">
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setOpen(true)
        }}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none px-2 py-1"
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl bg-glass-bg backdrop-blur-xs p-2 shadow-soft">
          <div className="flex flex-wrap gap-2">
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                className="chip hover:bg-white/15"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(s)}
              >
                #{s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
