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
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_user_date ON notes(userId, date DESC);
CREATE INDEX IF NOT EXISTS idx_files_user_date ON files(userId, date DESC);
`)

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
    contentSecurityPolicy: false, // удобнее в dev
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  }),
)
app.use(compression())
app.use(morgan(isProd ? 'combined' : 'dev'))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

// CORS
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true) // curl / native apps
      if (ALLOWED.has(origin)) return cb(null, true)
      cb(new Error('CORS: origin not allowed'))
    },
    credentials: true,
  }),
)

// Базовая защита от CSRF по Origin для мутаций
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'internal_error' })
})

// rate-limit только для аутентификации
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
  secure: isProd || Boolean(process.env.TRUST_PROXY),
  path: '/',
  maxAge: 7 * 24 * 3600 * 1000,
}

/* =========================
   Auth middleware
   ========================= */
const auth: RequestHandler = (req, res, next) => {
  try {
    const bearer = req.headers.authorization?.replace(/^Bearer\s+/, '') || req.cookies?.token
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
app.get('/api/notes', auth, (req, res) => {
  return res.json([])
})

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

app.post('/api/logout', (req, res) => {
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
  const { name, date, url } = req.body ?? {}
  if (typeof name !== 'string' || !name.trim())
    return res.status(400).json({ error: 'invalid_name' })
  if (date && typeof date !== 'string') return res.status(400).json({ error: 'invalid_date' })
  if (url && typeof url !== 'string') return res.status(400).json({ error: 'invalid_url' })

  const info = db
    .prepare('INSERT INTO notes(userId,name,date,url) VALUES(?,?,?,?)')
    .run(user.id, name.trim(), date ?? null, url ?? null)

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
  const { name, url, date } = req.body ?? {}
  if (typeof name !== 'string' || !name.trim())
    return res.status(400).json({ error: 'invalid_name' })
  if (typeof url !== 'string' || !url.trim()) return res.status(400).json({ error: 'invalid_url' })
  if (date && typeof date !== 'string') return res.status(400).json({ error: 'invalid_date' })

  const info = db
    .prepare('INSERT INTO files(userId,name,url,date) VALUES(?,?,?,?)')
    .run(user.id, name.trim(), url.trim(), date ?? null)

  const row = db.prepare('SELECT * FROM files WHERE id=?').get(info.lastInsertRowid as number)
  res.json(row)
})

app.patch('/api/files/:id', auth, (req, res) => {
  const { user } = req as AuthedRequest
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' })

  const sets: string[] = []
  const vals: unknown[] = []

  const { name, url, date } = req.body ?? {}
  if (typeof name === 'string') {
    sets.push('name=?')
    vals.push(name.trim())
  }
  if (typeof url === 'string') {
    sets.push('url=?')
    vals.push(url.trim())
  }
  if (typeof date === 'string') {
    sets.push('date=?')
    vals.push(date)
  }

  if (!sets.length) return res.status(400).json({ error: 'nothing_to_update' })

  vals.push(id, user.id)
  const sql = `UPDATE files SET ${sets.join(', ')} WHERE id=? AND userId=?`
  const info = db.prepare(sql).run(...vals)
  res.json({ updated: info.changes })
})

app.delete('/api/files/:id', auth, (req, res) => {
  const { user } = req as AuthedRequest
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' })

  const info = db.prepare('DELETE FROM files WHERE id=? AND userId=?').run(id, user.id)
  res.json({ deleted: info.changes })
})

/* =========================
   API 404 + errors
   ========================= */
app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }))

// Глобальный обработчик ошибок

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'internal_error' })
})

/* =========================
   Static SPA (prod)
   ========================= */
const distDir = path.resolve(process.cwd(), 'dist')
if (fs.existsSync(distDir)) {
  app.use(
    '/assets',
    express.static(path.join(distDir, 'assets'), {
      immutable: true,
      maxAge: '1y',
    }),
  )
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
  if (ORIGINS.length) {
    console.log('Allowed origins:', ORIGINS.join(', '))
  } else {
    console.log('Dev origins:', DEV_ORIGINS.join(', '))
  }
})
