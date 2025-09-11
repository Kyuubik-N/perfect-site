import 'dotenv/config'
import { Telegraf } from 'telegraf'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'

const token = process.env.TELEGRAM_TOKEN
if (!token) {
  console.error('Missing TELEGRAM_TOKEN in environment')
  process.exit(1)
}

const bot = new Telegraf(token)
const db = new Database('kyuubik.db')

// Resolve a target userId for saving notes created via Telegram.
// Priority:
// 1) BOT_USER_ID from env
// 2) Ensure a user with BOT_USERNAME (default: "telegram"); create with BOT_PASSWORD or random
function getTargetUserId(): number {
  const envId = process.env.BOT_USER_ID
  if (envId && String(Number(envId)) === String(envId)) return Number(envId)

  const username = process.env.BOT_USERNAME || 'telegram'
  const found = db.prepare('SELECT id FROM users WHERE username=?').get(username) as { id: number } | undefined
  if (found && typeof found.id === 'number') return found.id

  const password = process.env.BOT_PASSWORD || `tg-${Math.random().toString(36).slice(2, 10)}`
  const hash = bcrypt.hashSync(password, 10)
  const id = db.prepare('INSERT INTO users(username, password) VALUES(?, ?)').run(username, hash).lastInsertRowid as number
  if (!process.env.BOT_PASSWORD) {
    console.warn(`[bot] Created user "${username}" with a random password. Set BOT_PASSWORD to control it.`)
  }
  return id
}

bot.start((ctx) => ctx.reply('Привет! Пришли /addnote Заголовок | Текст | 2025-09-11'))

bot.command('addnote', (ctx) => {
  try {
    const raw = ctx.message?.text?.replace('/addnote', '').trim() ?? ''
    const parts = raw.split('|').map((s) => s.trim())
    const title = parts[0] || ''
    const text = parts[1] || ''
    let date = parts[2] || new Date().toISOString().slice(0, 10)
    // Basic YYYY-MM-DD check
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = new Date().toISOString().slice(0, 10)

    const userId = getTargetUserId()
    db.prepare('INSERT INTO notes(userId,title,text,date) VALUES(?,?,?,?)').run(userId, title, text, date)
    ctx.reply('Готово ✅')
  } catch (e) {
    console.error('[bot] addnote error:', e)
    ctx.reply('Ошибка при добавлении заметки ❌')
  }
})

bot.command('notes', (ctx) => {
  try {
    const userId = getTargetUserId()
    const rows = db
      .prepare('SELECT title,date FROM notes WHERE userId=? ORDER BY date DESC LIMIT 10')
      .all(userId) as Array<{ title: string; date: string }>
    ctx.reply(rows.length ? rows.map((r) => `• ${r.date}: ${r.title}`).join('\n') : 'Нет заметок')
  } catch (e) {
    console.error('[bot] notes error:', e)
    ctx.reply('Ошибка получения заметок ❌')
  }
})

bot.launch()
