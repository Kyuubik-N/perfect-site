import React from 'react'
import GlassCard from '../GlassCard'

/* локальное хранилище */
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

/* красивый keycap */
function Kbd({ children }) {
  return <span className="kbd">{children}</span>
}

export default function TipsPanel() {
  const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)
  const meta = isMac ? '⌘' : 'Ctrl'
  const [showOnStart, setShowOnStart] = useLS('tips_show_on_start', true)

  const shortcuts = [
    { keys: [meta, 'K'], label: 'Палитра команд' },
    { keys: ['/'], label: 'Фокус на поиск файлов' },
    { keys: ['N'], label: 'Новая заметка' },
    { keys: ['L'], label: 'Добавить ссылку' },
    { keys: ['Delete'], label: 'Удалить выбранные' },
    { keys: ['Esc'], label: 'Закрыть окна / снять выделение' },
  ]

  const copyCheatsheet = async () => {
    const lines = [
      'Kyuubik — горячие клавиши:',
      ...shortcuts.map((s) => `• ${s.keys.join('+')} — ${s.label}`),
    ].join('\n')
    try {
      await navigator.clipboard?.writeText(lines)
    } catch {}
    alert('Шпаргалка скопирована в буфер обмена')
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-fg-strong">Советы</h3>

        <div className="flex items-center gap-2">
          <button
            className={`glass-button ${showOnStart ? 'glass-toggle-active' : ''}`}
            onClick={() => setShowOnStart((v) => !v)}
            title="Показывать эту панель при старте"
          >
            {showOnStart ? 'Показывать при старте: ON' : 'Показывать при старте: OFF'}
          </button>
          <button
            className="glass-button"
            onClick={copyCheatsheet}
            title="Скопировать список горячих клавиш"
          >
            ⧉ Шпаргалка
          </button>
        </div>
      </div>

      <div className="tips-grid">
        <section>
          <div className="tips-title">Горячие клавиши</div>
          <ul className="tips-shortcuts">
            {shortcuts.map((s, i) => (
              <li key={i}>
                <span className="tips-keys">
                  {s.keys.map((k, j) => (
                    <React.Fragment key={j}>
                      <Kbd>{k}</Kbd>
                      {j < s.keys.length - 1 ? <span className="mx-1">+</span> : null}
                    </React.Fragment>
                  ))}
                </span>
                <span className="tips-label">{s.label}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="tips-title">Лайфхаки</div>
          <ul className="tips-list">
            <li>Перетащи файл в окно «Файлы» — загрузка начнётся сразу.</li>
            <li>
              Выдели несколько карточек и нажми <Kbd>Delete</Kbd> — массовое удаление.
            </li>
            <li>
              В «Каталоге» используй фильтр и <Kbd>Enter</Kbd> — моментальный переход к первому
              результату.
            </li>
            <li>
              Цвета и стекло настраиваются в «Дизайнере темы» справа — попробуй кнопку{' '}
              <span className="glass-button glass-button--icon" aria-hidden>
                🎲
              </span>{' '}
              «Случайно».
            </li>
            <li>Тема «Auto» следует системной (меняется в статус-баре ОС).</li>
          </ul>
        </section>
      </div>
    </GlassCard>
  )
}
