import 'dotenv/config'
import path from 'node:path'
import fs from 'node:fs'
import express, {
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Database from 'better-sqlite3'
import multer from 'multer'

/* =========================
   Config
   ========================= */
const API_HOST = process.env.API_HOST ?? '127.0.0.1'
const API_PORT = Number(process.env.API_PORT ?? 5174)
const isProd = process.env.NODE_ENV === 'production'

const ORIGINS = (process.env.APP_ORIGIN ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const DEV_ORIGINS = ['http://127.0.0.1:5173', 'http://localhost:5173']
const ALLOWED = new Set([...ORIGINS, ...DEV_ORIGINS])

// uploads
const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

/* =========================
   DB (SQLite, WAL)
   ========================= */
const db = new Database(path.resolve(process.cwd(), 'kyuubik.db'))
db.pragma('journal_mode = WAL')

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  name TEXT NOT NULL,
  date TEXT,
  url TEXT,
  tags TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  date TEXT,
  tags TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,          -- YYYY-MM-DD
  timeStart TEXT,              -- HH:MM
  timeEnd TEXT,                -- HH:MM
  description TEXT,
  tags TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS og_cache (
  url TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  image TEXT,
  domain TEXT,
  fetched_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_notes_user_date ON notes(userId, date DESC);
CREATE INDEX IF NOT EXISTS idx_files_user_date ON files(userId, date DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_date ON events(userId, date);
`)

// авто-миграции
function ensureColumn(table: 'notes'|'files'|'events', col: string, def = "''") {
  const info = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{name:string}>
  if (!info.some(c => c.name === col)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col} TEXT DEFAULT ${def}`).run()
  }
}
ensureColumn('notes', 'tags')
ensureColumn('files', 'tags')
ensureColumn('events', 'tags')

/* =========================
   Types
   ========================= */
type JwtUser = { id: number; username: string }
type AuthedRequest = Request & { user: JwtUser }

/* =========================
   App & middlewares
   ========================= */
const app = express()
app.set('trust proxy', process.env.TRUST_PROXY ? 1 : 0)

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  }),
)
app.use(compression())
app.use(morgan(isProd ? 'combined' : 'dev'))
app.use(express.json({ limit: '4mb' }))
app.use(cookieParser())

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true)
      if (ALLOWED.has(origin)) return cb(null, true)
      cb(new Error('CORS: origin not allowed'))
    },
    credentials: true,
  }),
)

// простая CSRF по Origin для мутаций
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin
    if (origin && !ALLOWED.has(origin)) {
      return res.status(403).json({ error: 'bad_origin' })
    }
  }
  next()
})

const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
})

/* =========================
   Helpers
   ========================= */
const signToken = (user: JwtUser) =>
  jwt.sign(user, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProd,
  path: '/',
  maxAge: 7 * 24 * 3600 * 1000,
}

// безопасное имя файла
function sanitizeName(s: string) {
  const base = (s || 'file').normalize('NFKC')
  try {
    return base.replace(/[^\p{L}\p{N}._\s-]/gu, '').replace(/\s+/g, '_').slice(0, 140) || 'file'
  } catch {
    return base.replace(/[^a-zA-Z0-9._\s-]/g, '').replace(/\s+/g, '_').slice(0, 140) || 'file'
  }
}

function normalizeTags(input: unknown): string {
  const arr: string[] = Array.isArray(input)
    ? input as string[]
    : typeof input === 'string'
    ? input.split(',') : []
  const clean = Array.from(
    new Set(
      arr
        .map(s => String(s).toLowerCase().trim())
        .filter(Boolean)
        .map(s => s.replace(/[,\s]+/g, '-').slice(0, 40))
    )
  )
  return clean.join(',')
}

/* =========================
   Health
   ========================= */
app.get('/api/ping', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

/* =========================
   Auth middleware
   ========================= */
const auth: RequestHandler = (req, res, next) => {
  try {
    const bearer = req.headers.authorization?.replace(/^Bearer\s+/, '') || (req as any).cookies?.token
    if (!bearer) return res.status(401).json({ error: 'unauthorized' })
    const payload = jwt.verify(bearer, process.env.JWT_SECRET || 'dev-secret') as JwtUser
    ;(req as AuthedRequest).user = payload
    next()
  } catch {
    res.status(401).json({ error: 'invalid_token' })
  }
}

/* =========================
   Public API
   ========================= */
app.post('/api/register', authLimiter, (req, res) => {
  const { username, password } = req.body ?? {}
  if (typeof username !== 'string' || username.length < 3)
    return res.status(400).json({ error: 'invalid_username' })
  if (typeof password !== 'string' || password.length < 4)
    return res.status(400).json({ error: 'invalid_password' })

  const exists = db.prepare('SELECT id FROM users WHERE username=?').get(username)
  if (exists) return res.status(409).json({ error: 'user_exists' })

  const hash = bcrypt.hashSync(password, 10)
  const info = db.prepare('INSERT INTO users(username,password) VALUES(?,?)').run(username, hash)
  const user: JwtUser = { id: Number(info.lastInsertRowid), username }
  const token = signToken(user)
  res.cookie('token', token, cookieOpts)
  res.json({ user, token })
})

app.post('/api/login', authLimiter, (req, res) => {
  const { username, password } = req.body ?? {}
  if (typeof username !== 'string' || typeof password !== 'string')
    return res.status(400).json({ error: 'invalid_body' })

  const row = db.prepare('SELECT id, password FROM users WHERE username=?').get(username) as
    | { id: number; password: string }
    | undefined
  if (!row || !bcrypt.compareSync(password, row.password))
    return res.status(401).json({ error: 'wrong_credentials' })

  const user: JwtUser = { id: row.id, username }
  const token = signToken(user)
  res.cookie('token', token, cookieOpts)
  res.json({ user, token })
})

app.post('/api/logout', (_req, res) => {
  res.clearCookie('token', { ...cookieOpts, maxAge: 0 })
  res.json({ ok: true })
})

/* =========================
   Private API (requires auth)
   ========================= */
app.get('/api/me', auth, (req, res) => {
  const { user } = req as AuthedRequest
  res.json({ user })
})

/* ----- NOTES ----- */
app.get('/api/notes', auth, (req, res) => {
  const { user } = req as AuthedRequest
  const rows = db
    .prepare('SELECT * FROM notes WHERE userId=? ORDER BY date DESC, id DESC')
    .all(user.id)
  res.json(rows)
})

app.post('/api/notes', auth, (req, res) => {
  const { user } = req as AuthedRequest
  const { name, date, url, tags } = req.body ?? {}
  if (typeof name !== 'string' || !name.trim())
    return res.status(400).json({ error: 'invalid_name' })
  if (date && typeof date !== 'string') return res.status(400).json({ error: 'invalid_date' })
  if (url && typeof url !== 'string') return res.status(400).json({ error: 'invalid_url' })
  const tagsStr = normalizeTags(tags)

  const info = db.prepare('INSERT INTO notes(userId,name,date,url,tags) VALUES(?,?,?,?,?)')
    .run(user.id, name.trim(), date ?? null, url ?? null, tagsStr)

  const row = db.prepare('SELECT * FROM notes WHERE id=?').get(info.lastInsertRowid as number)
  res.json(row)
})

app.delete('/api/notes/:id', auth, (req, res) => {
  const { user } = req as AuthedRequest
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' })

  const info = db.prepare('DELETE FROM notes WHERE id=? AND userId=?').run(id, user.id)
  res.json({ deleted: info.changes })
})

/* ----- FILES (links) ----- */
app.get('/api/files', auth, (req, res) => {
  const { user } = req as AuthedRequest
  const rows = db
    .prepare('SELECT * FROM files WHERE userId=? ORDER BY date DESC, id DESC')
    .all(user.id)
  res.json(rows)
})

app.post('/api/files', auth, (req, res) => {
  const { user } = req as AuthedRequest
  const { name, url, date, tags } = req.body ?? {}
  if (typeof name !== 'string' || !name.trim())
    return res.status(400).json({ error: 'invalid_name' })
  if (typeof url !== 'string' || !url.trim()) return res.status(400).json({ error: 'invalid_url' })
  if (date && typeof date !== 'string') return res.status(400).json({ error: 'invalid_date' })
  const tagsStr = normalizeTags(tags)

  const info = db.prepare('INSERT INTO files(userId,name,url,date,tags) VALUES(?,?,?,?,?)')
    .run(user.id, name.trim(), url.trim(), date ?? null, tagsStr)

  const row = db.prepare('SELECT * FROM files WHERE id=?').get(info.lastInsertRowid as number)
  res.json(row)
})

app.patch('/api/files/:id', auth, (req, res) => {
  const { user } = req as AuthedRequest
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' })

  const sets: string[] = []
  const vals: unknown[] = []

  const { name, url, date, tags } = req.body ?? {}
  if (typeof name === 'string') { sets.push('name=?'); vals.push(name.trim()) }
  if (typeof url === 'string')  { sets.push('url=?');  vals.push(url.trim()) }
  if (typeof date === 'string') { sets.push('date=?'); vals.push(date) }
  if (typeof tags !== 'undefined') { sets.push('tags=?'); vals.push(normalizeTags(tags)) }

  if (!sets.length) return res.status(400).json({ error: 'nothing_to_update' })

  vals.push(id, user.id)
  const sql = `UPDATE files SET ${sets.join(', ')} WHERE id=? AND userId=?`
  const info = db.prepare(sql).run(...(vals as any[]))
  res.json({ updated: info.changes })
})

app.delete('/api/files/:id', auth, (req, res) => {
  const { user } = req as AuthedRequest
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' })

  const row = db.prepare('SELECT url FROM files WHERE id=? AND userId=?').get(id, user.id) as { url?: string } | undefined
  const info = db.prepare('DELETE FROM files WHERE id=? AND userId=?').run(id, user.id)

  if (info.changes && row?.url?.startsWith('/u/')) {
    const p = row.url.replace(/^\/u\//, '')
    const filePath = path.join(UPLOAD_DIR, p)
    try { fs.unlinkSync(filePath) } catch {}
  }
  res.json({ deleted: info.changes })
})

/* ----- CALENDAR (events) ----- */
app.get('/api/calendar', auth, (req, res) => {
  const { user } = req as AuthedRequest
  const from = String(req.query.from || '')
  const to = String(req.query.to || '')
  let rows: any[] = []
  if (from && to) {
    rows = db.prepare('SELECT * FROM events WHERE userId=? AND date>=? AND date<=? ORDER BY date, timeStart, id')
      .all(user.id, from, to)
  } else {
    rows = db.prepare('SELECT * FROM events WHERE userId=? ORDER BY date DESC, id DESC').all(user.id)
  }
  res.json(rows)
})

app.post('/api/calendar', auth, (req, res) => {
  const { user } = req as AuthedRequest
  const { title, date, timeStart, timeEnd, description, tags } = req.body ?? {}
  if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'invalid_title' })
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'invalid_date' })
  if (timeStart && typeof timeStart !== 'string') return res.status(400).json({ error: 'invalid_time' })
  if (timeEnd && typeof timeEnd !== 'string') return res.status(400).json({ error: 'invalid_time' })
  const tagsStr = normalizeTags(tags)

  const info = db.prepare(
    'INSERT INTO events(userId,title,date,timeStart,timeEnd,description,tags) VALUES(?,?,?,?,?,?,?)'
  ).run(user.id, title.trim(), date, timeStart ?? null, timeEnd ?? null, description ?? null, tagsStr)

  const row = db.prepare('SELECT * FROM events WHERE id=?').get(info.lastInsertRowid as number)
  res.json(row)
})

app.patch('/api/calendar/:id', auth, (req, res) => {
  const { user } = req as AuthedRequest
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' })

  const { title, date, timeStart, timeEnd, description, tags } = req.body ?? {}
  const sets: string[] = []
  const vals: unknown[] = []
  if (typeof title === 'string') { sets.push('title=?'); vals.push(title.trim()) }
  if (typeof date === 'string') { sets.push('date=?'); vals.push(date) }
  if (typeof timeStart === 'string' || timeStart === null) { sets.push('timeStart=?'); vals.push(timeStart) }
  if (typeof timeEnd === 'string' || timeEnd === null) { sets.push('timeEnd=?'); vals.push(timeEnd) }
  if (typeof description === 'string' || description === null) { sets.push('description=?'); vals.push(description) }
  if (typeof tags !== 'undefined') { sets.push('tags=?'); vals.push(normalizeTags(tags)) }
  if (!sets.length) return res.status(400).json({ error: 'nothing_to_update' })

  vals.push(id, user.id)
  const sql = `UPDATE events SET ${sets.join(', ')} WHERE id=? AND userId=?`
  const info = db.prepare(sql).run(...(vals as any[]))
  res.json({ updated: info.changes })
})

app.delete('/api/calendar/:id', auth, (req, res) => {
  const { user } = req as AuthedRequest
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' })
  const info = db.prepare('DELETE FROM events WHERE id=? AND userId=?').run(id, user.id)
  res.json({ deleted: info.changes })
})

/* ----- SEARCH (notes + files + events) ----- */
app.get('/api/search', auth, (req, res) => {
  const { user } = req as AuthedRequest
  const q = String(req.query.q || '').toLowerCase().trim()
  if (!q) return res.json({ notes: [], files: [], events: [] })
  const like = `%${q}%`

  const notes = db.prepare(
    `SELECT id, name, date, url, tags
     FROM notes
     WHERE userId=? AND (
       LOWER(name) LIKE ? OR LOWER(IFNULL(url,'')) LIKE ? OR LOWER(IFNULL(tags,'')) LIKE ?
     )
     ORDER BY date DESC, id DESC
     LIMIT 20`
  ).all(user.id, like, like, like)

  const files = db.prepare(
    `SELECT id, name, url, date, tags
     FROM files
     WHERE userId=? AND (
       LOWER(name) LIKE ? OR LOWER(url) LIKE ? OR LOWER(IFNULL(tags,'')) LIKE ?
     )
     ORDER BY date DESC, id DESC
     LIMIT 20`
  ).all(user.id, like, like, like)

  const events = db.prepare(
    `SELECT id, title, date, timeStart, timeEnd, description, tags
     FROM events
     WHERE userId=? AND (
       LOWER(title) LIKE ? OR LOWER(IFNULL(description,'')) LIKE ? OR LOWER(IFNULL(tags,'')) LIKE ?
     )
     ORDER BY date DESC, id DESC
     LIMIT 20`
  ).all(user.id, like, like, like)

  res.json({ notes, files, events })
})

/* ----- LIBRARY (links aggregated from notes + files) ----- */
app.get('/api/library', auth, (req, res) => {
  const { user } = req as AuthedRequest

  const rows = db.prepare(
    `SELECT *
     FROM (
       SELECT id, name, url, date, tags, created_at, 'file' AS kind
         FROM files
         WHERE userId=? AND IFNULL(url,'') <> ''
       UNION ALL
       SELECT id, name, url, date, tags, created_at, 'note' AS kind
         FROM notes
         WHERE userId=? AND IFNULL(url,'') <> ''
     ) AS x
     ORDER BY CASE WHEN x.date IS NULL OR x.date='' THEN 1 ELSE 0 END,
              x.date DESC,
              x.id DESC
     LIMIT 500`
  ).all(user.id, user.id) as Array<{
    id:number; name:string; url:string; date?:string|null; tags?:string; created_at:string; kind:'file'|'note'
  }>

  const items = rows.map(r => {
    let domain = ''
    try {
      if (r.url?.startsWith('/u/')) {
        domain = 'local'
      } else {
        const u = new URL(r.url)
        domain = u.hostname
      }
    } catch { /* ignore malformed */ }
    return { ...r, domain }
  })

  res.json(items)
})

/* ----- OG PREVIEW (fetch & cache) ----- */
function isPrivateHost(host: string) {
  const h = host.toLowerCase()
  if (h === 'localhost') return true
  if (h.startsWith('127.') || h === '::1') return true
  // IPv4 приватные диапазоны
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(h)) return true
  return false
}

function htmlPickMeta(html: string) {
  // простой парсер: берём og:title/description/image и <title>
  const pick = (re: RegExp) => (html.match(re)?.[1] || '').trim()
  const ogTitle = pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i)
  const ogDesc  = pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i)
  const ogImg   = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)
  const title   = pick(/<title[^>]*>([^<]*)<\/title>/i)
  const descNm  = pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)
  return {
    title: ogTitle || title || '',
    description: ogDesc || descNm || '',
    image: ogImg || '',
  }
}

app.get('/api/og', auth, async (req, res) => {
  try {
    const u = String(req.query.url || '').trim()
    const refresh = String(req.query.refresh || '') === '1'
    if (!/^https?:\/\//i.test(u)) return res.status(400).json({ error: 'invalid_url' })

    const { hostname } = new URL(u)
    if (isPrivateHost(hostname)) return res.status(400).json({ error: 'forbidden_host' })

    const row = db.prepare('SELECT * FROM og_cache WHERE url=?').get(u) as any
    const ttlHours = 24 * 7 // 7 дней
    if (row && !refresh) {
      const age = (Date.now() - new Date(row.fetched_at).getTime()) / 36e5
      if (age < ttlHours) {
        return res.json(row)
      }
    }

    // fetch с таймаутом
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 6000)
    const resp = await fetch(u, {
      signal: ctrl.signal,
      headers: { 'user-agent': 'perfect-site/1.0 (+og-fetch)' },
    }).catch((e) => {
      if (e.name === 'AbortError') throw new Error('fetch_timeout')
      throw e
    }).finally(() => clearTimeout(timer))

    const ctype = resp.headers.get('content-type') || ''
    if (!resp.ok || !/text\/html/i.test(ctype)) {
      // если не HTML — просто вернём заголовок домена
      const domain = hostname
      const data = { url: u, title: domain, description: '', image: '', domain, fetched_at: new Date().toISOString() }
      db.prepare(`
        INSERT INTO og_cache(url,title,description,image,domain,fetched_at)
        VALUES(?,?,?,?,?,?)
        ON CONFLICT(url) DO UPDATE SET title=excluded.title,description=excluded.description,image=excluded.image,domain=excluded.domain,fetched_at=excluded.fetched_at
      `).run(data.url, data.title, data.description, data.image, data.domain, data.fetched_at)
      return res.json(data)
    }

    const html = (await resp.text()).slice(0, 200_000) // safety cap
    const meta = htmlPickMeta(html)
    const domain = hostname
    const record = {
      url: u,
      title: meta.title || domain,
      description: meta.description || '',
      image: meta.image || '',
      domain,
      fetched_at: new Date().toISOString(),
    }
    db.prepare(`
      INSERT INTO og_cache(url,title,description,image,domain,fetched_at)
      VALUES(?,?,?,?,?,?)
      ON CONFLICT(url) DO UPDATE SET title=excluded.title,description=excluded.description,image=excluded.image,domain=excluded.domain,fetched_at=excluded.fetched_at
    `).run(record.url, record.title, record.description, record.image, record.domain, record.fetched_at)

    res.json(record)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'og_failed' })
  }
})

/* ----- TAGS / EXPORT / IMPORT ----- */
app.get('/api/tags', auth, (req, res) => {
  const { user } = req as AuthedRequest
  const rows = db.prepare(
    `SELECT tags FROM notes WHERE userId=?
     UNION ALL
     SELECT tags FROM files WHERE userId=?
     UNION ALL
     SELECT tags FROM events WHERE userId=?`,
  ).all(user.id, user.id, user.id) as Array<{tags?: string}>
  const set = new Set<string>()
  for (const r of rows) {
    String(r.tags || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .forEach(t => set.add(t))
  }
  res.json({ tags: Array.from(set).sort() })
})

app.get('/api/export', auth, (req, res) => {
  const { user } = req as AuthedRequest
  const notes = db.prepare('SELECT id,name,date,url,tags,created_at FROM notes WHERE userId=? ORDER BY id').all(user.id)
  const files = db.prepare('SELECT id,name,url,date,tags,created_at FROM files WHERE userId=? ORDER BY id').all(user.id)
  const events = db.prepare('SELECT id,title,date,timeStart,timeEnd,description,tags,created_at FROM events WHERE userId=? ORDER BY id').all(user.id)
  res.json({ exportedAt: new Date().toISOString(), notes, files, events })
})

app.post('/api/import', auth, (req, res) => {
  const { user } = req as AuthedRequest
  const { notes = [], files = [], events = [] } = req.body ?? {}

  let n = 0, f = 0, e = 0
  const insNote = db.prepare('INSERT INTO notes(userId,name,date,url,tags) VALUES(?,?,?,?,?)')
  const insFile = db.prepare('INSERT INTO files(userId,name,url,date,tags) VALUES(?,?,?,?,?)')
  const insEvent = db.prepare('INSERT INTO events(userId,title,date,timeStart,timeEnd,description,tags) VALUES(?,?,?,?,?,?,?)')

  db.transaction(() => {
    for (const it of notes as any[]) {
      if (!it?.name) continue
      insNote.run(user.id, String(it.name), it.date ?? null, it.url ?? null, normalizeTags(it.tags))
      n++
    }
    for (const it of files as any[]) {
      if (!it?.name || !it?.url) continue
      insFile.run(user.id, String(it.name), String(it.url), it.date ?? null, normalizeTags(it.tags))
      f++
    }
    for (const it of events as any[]) {
      if (!it?.title || !it?.date) continue
      insEvent.run(
        user.id,
        String(it.title),
        String(it.date),
        it.timeStart ?? null,
        it.timeEnd ?? null,
        it.description ?? null,
        normalizeTags(it.tags)
      )
      e++
    }
  })()

  res.json({ imported: { notes: n, files: f, events: e } })
})

/* ----- UPLOADS ----- */
const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const user = (req as AuthedRequest).user
    const userDir = path.join(UPLOAD_DIR, String(user.id))
    fs.mkdirSync(userDir, { recursive: true })
    cb(null, userDir)
  },
  filename(_req, file, cb) {
    const safe = sanitizeName(file.originalname)
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    cb(null, `${stamp}__${safe}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 * 1024 },
})

app.post('/api/upload', auth, upload.array('file', 20), (req, res) => {
  const { user } = req as AuthedRequest
  const files = (req.files as any[]) || []
  const rows: any[] = []
  for (const f of files) {
    const url = `/u/${user.id}/${path.basename(f.path)}`
    const name = f.originalname
    const info = db
      .prepare('INSERT INTO files(userId,name,url,date,tags) VALUES(?,?,?,?,?)')
      .run(user.id, name, url, new Date().toISOString().slice(0, 10), '')
    const row = db.prepare('SELECT * FROM files WHERE id=?').get(info.lastInsertRowid as number)
    rows.push(row)
  }
  res.json({ uploaded: rows })
})

/* ----- ICS EXPORT ----- */
function icsEscape(s: string) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}
function icsDt(date: string, time?: string | null) {
  if (!time) return date.replace(/-/g, '')
  const [h, m] = time.split(':').map(Number)
  const d = new Date(date + 'T00:00:00')
  d.setHours(h || 0, m || 0, 0, 0)
  const YYYY = d.getFullYear()
  const MM = String(d.getMonth() + 1).padStart(2, '0')
  const DD = String(d.getDate()).padStart(2, '0')
  const HH = String(d.getHours()).padStart(2, '0')
  const MI = String(d.getMinutes()).padStart(2, '0')
  const SS = '00'
  return `${YYYY}${MM}${DD}T${HH}${MI}${SS}`
}

app.get('/api/calendar.ics', auth, (req, res) => {
  const { user } = req as AuthedRequest
  const from = String(req.query.from || '')
  const to = String(req.query.to || '')
  let rows: any[] = []
  if (from && to) {
    rows = db.prepare('SELECT * FROM events WHERE userId=? AND date>=? AND date<=? ORDER BY date, timeStart, id')
      .all(user.id, from, to)
  } else {
    rows = db.prepare('SELECT * FROM events WHERE userId=? ORDER BY date, timeStart, id').all(user.id)
  }
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const lines: string[] = []
  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('PRODID:-//perfect-site//calendar//EN')
  for (const ev of rows) {
    const uid = `event-${ev.id}@perfect-site`
    const allDay = !ev.timeStart
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTAMP:${dtstamp}`)
    if (allDay) {
      lines.push(`DTSTART;VALUE=DATE:${icsDt(ev.date)}`)
      if (ev.timeEnd) {
        lines.push(`DTEND;VALUE=DATE:${icsDt(ev.date)}`) // на всякий
      }
    } else {
      lines.push(`DTSTART:${icsDt(ev.date, ev.timeStart)}`)
      if (ev.timeEnd) lines.push(`DTEND:${icsDt(ev.date, ev.timeEnd)}`)
    }
    lines.push(`SUMMARY:${icsEscape(ev.title)}`)
    if (ev.description) lines.push(`DESCRIPTION:${icsEscape(ev.description)}`)
    if (ev.tags) lines.push(`CATEGORIES:${icsEscape(ev.tags)}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  const body = lines.join('\r\n')
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"')
  res.send(body)
})

/* =========================
   API 404 + errors
   ========================= */
app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }))
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'internal_error' })
})

/* =========================
   Static: uploads & SPA
   ========================= */
app.use('/u', express.static(UPLOAD_DIR, { fallthrough: true, maxAge: isProd ? '7d' : 0 }))

const distDir = path.resolve(process.cwd(), 'dist')
if (fs.existsSync(distDir)) {
  app.use('/assets', express.static(path.join(distDir, 'assets'), { immutable: true, maxAge: '1y' }))
  app.use(express.static(distDir))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

/* =========================
   Start
   ========================= */
app.listen(API_PORT, API_HOST, () => {
  console.log(`API ready on http://${API_HOST}:${API_PORT}`)
  if (ORIGINS.length) console.log('Allowed origins:', ORIGINS.join(', '))
  else console.log('Dev origins:', DEV_ORIGINS.join(', '))
  console.log('Uploads:', UPLOAD_DIR, '→ served at /u')
})
