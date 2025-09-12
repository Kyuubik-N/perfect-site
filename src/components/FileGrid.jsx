import React from 'react'

const isImg = (name = '') => /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(name)
const isVideo = (name = '') => /\.(mp4|webm|ogg|m4v|mov)$/i.test(name)

function Card({ item, onPreview, onOpen, onCopy, onDelete, onRename }) {
  const title = item.name || (item.url ? 'Ссылка' : 'Файл')
  const thumb = item.url || item.thumb

  const Placeholder = () => (
    <div className="h-36 rounded-xl bg-[color:var(--placeholder-bg)] grid place-items-center text-fg/40 text-sm">
      {item.url ? 'Ссылка' : 'Файл'}
    </div>
  )

  return (
    <div className="fcard">
      <div className="fcard-media" onClick={() => (thumb ? onPreview?.(item) : onOpen?.(item))}>
        {thumb ? (
          isImg(thumb) ? (
            <img src={thumb} alt={title} className="fcard-img" loading="lazy" />
          ) : isVideo(thumb) ? (
            <div className="fcard-video">
              <video src={thumb} muted />
              <div className="fcard-play">▶</div>
            </div>
          ) : (
            <Placeholder />
          )
        ) : (
          <Placeholder />
        )}
      </div>

      <div className="mt-2 px-2">
        <div className="text-sm text-fg-strong truncate" title={title}>
          {title}
        </div>
        <div className="text-xs text-fg/55">{item.date || ''}</div>
      </div>

      <div className="fcard-actions">
        {item.url && (
          <>
            <button className="chip" title="Открыть" onClick={() => onOpen?.(item)}>
              ↗
            </button>
            <button className="chip" title="Копировать ссылку" onClick={() => onCopy?.(item)}>
              ⧉
            </button>
          </>
        )}
        <button className="chip" title="Переименовать" onClick={() => onRename?.(item)}>
          ✎
        </button>
        <button className="chip chip-danger" title="Удалить" onClick={() => onDelete?.(item)}>
          🗑
        </button>
      </div>
    </div>
  )
}

export default function FileGrid({
  items = [],
  loading = false,
  onPreview,
  onOpen,
  onCopy,
  onDelete,
  onRename,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="fcard skeleton" />
        ))}
      </div>
    )
  }
  if (!items?.length) {
    return <div className="muted">Пока нет файлов</div>
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
      {items.map((it) => (
        <Card
          key={it.id}
          item={it}
          onPreview={onPreview}
          onOpen={onOpen}
          onCopy={onCopy}
          onDelete={onDelete}
          onRename={onRename}
        />
      ))}
    </div>
  )
}
