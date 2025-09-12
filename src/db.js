// Simple IndexedDB wrapper for notes and files
const DB_NAME = 'perfect'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('notes')) {
        const store = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true })
        store.createIndex('by_date', 'date') // YYYY-MM-DD
        store.createIndex('by_created', 'createdAt')
      }
      if (!db.objectStoreNames.contains('files')) {
        const store = db.createObjectStore('files', { keyPath: 'id', autoIncrement: true })
        store.createIndex('by_date', 'date')
        store.createIndex('by_created', 'createdAt')
        store.createIndex('by_type', 'type')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx(storeName, mode, fn) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    const res = fn(store)
    transaction.oncomplete = () => resolve(res)
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function addNote({ title, date, content = '' }) {
  const createdAt = Date.now()
  const item = { title, date, content, createdAt }
  return tx('notes', 'readwrite', (store) => store.add(item))
}

export async function getNotes() {
  return tx('notes', 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  })
}

export async function getNotesByDate(date) {
  return tx('notes', 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const idx = store.index('by_date')
      const req = idx.getAll(date)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  })
}

export async function deleteNote(id) {
  return tx('notes', 'readwrite', (store) => store.delete(id))
}

export async function addFile({ file, date }) {
  const createdAt = Date.now()
  const { name, type, size } = file
  const blob = file
  const item = { name, type, size, date, createdAt, blob }
  return tx('files', 'readwrite', (store) => store.add(item))
}

export async function getFiles() {
  return tx('files', 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  })
}

export async function getFilesByDate(date) {
  return tx('files', 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const idx = store.index('by_date')
      const req = idx.getAll(date)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  })
}

export async function deleteFile(id) {
  return tx('files', 'readwrite', (store) => store.delete(id))
}

export function ymd(date = new Date()) {
  const d = new Date(date)
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
