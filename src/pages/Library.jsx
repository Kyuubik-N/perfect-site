import React from 'react'
import { addFile, getFiles, deleteFile, ymd } from '../db'

function isBlob(x) {
  return typeof Blob !== 'undefined' && x instanceof Blob
}

function Preview({ file }) {
  const [url, setUrl] = React.useState('')
  const hasBlob = isBlob(file?.blob)

  React.useEffect(() => {
    if (!hasBlob) return
    let u = ''
    try {
      u = URL.createObjectURL(file.blob)
      setUrl(u)
    } catch {}
    return () => {
      if (u) URL.revokeObjectURL(u)
    }
  }, [file, hasBlob])

  if (!hasBlob) {
    return (
      <div className="w-full h-36 rounded-lg bg-white/5 border border-white/10 grid place-items-center text-white/60">
        Предпросмотр недоступен
      </div>
    )
  }
  if (file.type?.startsWith('image/')) {
    return (
      <img
        src={url}
        alt={file.name}
        className="w-full h-36 object-cover rounded-lg"
        loading="lazy"
        decoding="async"
      />
    )
  }
  if (file.type?.startsWith('video/')) {
    return (
      <video
        src={url}
        className="w-full h-36 object-cover rounded-lg"
        controls
        preload="metadata"
      />
    )
  }
  if (file.type?.startsWith('audio/')) {
    return <audio src={url} className="w-full" controls preload="none" />
  }
  return (
    <a
      href={url}
      download={file.name}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
    >
      ⬇️ {file.name}
    </a>
  )
}

export default function LibraryPage() {
  const [files, setFiles] = React.useState([])
  const [date, setDate] = React.useState(ymd())
  const [error, setError] = React.useState('')

  const load = React.useCallback(async () => {
    try {
      setError('')
      const all = await getFiles()
      all.sort((a, b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0))
      setFiles(all)
    } catch (e) {
      setError((e && e.message) || 'Ошибка чтения локального хранилища')
      setFiles([])
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const onPick = async (e) => {
    try {
      const list = Array.from(e.target.files || [])
      for (const f of list) {
        await addFile({ file: f, date })
      }
    } finally {
      e.target.value = ''
      await load()
    }
  }

  async function resetLocalFiles() {
    try {
      if (!confirm('Сбросить локальные файлы? Это удалит данные в этом браузере.')) return
      await new Promise((resolve) => {
        const req = indexedDB.deleteDatabase('perfect')
        req.onsuccess = req.onerror = req.onblocked = () => resolve()
      })
      await load()
    } catch {}
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-10">
      <h2 className="text-2xl font-semibold gradient-text">Файлы</h2>
      <div className="mt-4 glass p-4 flex flex-col sm:flex-row gap-3 items-center">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input max-w-[14rem]"
        />
        <label className="btn cursor-pointer" tabIndex="0">
          Загрузить файлы
          <input type="file" multiple className="hidden" onChange={onPick} />
        </label>
      </div>

      {error && (
        <div className="mt-4 glass p-3 rounded-xl text-sm text-red-300">
          Ошибка: {error}
          <div className="mt-2">
            <button className="btn" onClick={resetLocalFiles}>
              Сбросить локальные файлы
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {files.length === 0 && <div className="text-white/60">Пока нет файлов</div>}
        {files.map((f) => (
          <div key={f.id} className="glass p-3 flex flex-col gap-2">
            <Preview file={f} />
            <div className="text-sm text-slate-700 dark:text-slate-300 truncate">{f.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {f.date} · {(f.size / 1024).toFixed(1)} KB
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await deleteFile(f.id)
                  await load()
                }}
                className="px-3 py-1.5 rounded-md border border-red-200/60 dark:border-red-800/60 text-red-700 dark:text-red-300 hover:bg-red-50/60 dark:hover:bg-red-900/10"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
