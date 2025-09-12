Kyuubik — personal cloud (notes, calendar, files)

Quick start

- Copy `.env` and set secrets. Recommended: set `JWT_SECRET` for production.
- Dev: `npm run dev:all` (starts API on 5174 and Vite on 5173)
- API only: `npm run api:dev`
- Build SPA: `npm run build` and then `npm run api` to serve from `dist/`

Notable improvements

- Security: Helmet headers, gzip compression, basic CSRF origin check for mutating requests, and rate‑limiting for auth endpoints.
- Cookies: `secure` enabled automatically in production. `sameSite=lax` kept for CSRF resilience.
- CORS: Accepts `127.0.0.1`/`localhost` and configurable `APP_ORIGIN` list.
- API DX: JSON 404 for unknown `/api/*`, global error handler, `/api/ping` healthcheck.
- Performance: Long‑term caching for hashed assets under `dist/assets`.
- DB: Indexes for faster per‑user listing of notes/files.
- PWA: Manifest icons (SVG), assets caching, and offline‑friendly navigation (excludes `/api`).
- Frontend: Robust API helper with timeout/host fallbacks and optional `VITE_API_BASE` override.

Configuration

- `APP_ORIGIN`: comma‑separated list of allowed frontend origins (for CORS and CSRF origin checks).
- `API_HOST`/`API_PORT`: where the API binds (defaults `127.0.0.1:5174`).
- `JWT_SECRET`: token signing secret (required in production).
- `TRUST_PROXY=1`: enable when running behind a reverse proxy to set secure cookies.
- `VITE_API_BASE`: optional frontend override for API base URL (e.g., `https://api.example.com`).
- Telegram bot:
  - `TELEGRAM_TOKEN`: Bot token (required).
  - `BOT_USER_ID`: Optional numeric `users.id` to attach notes to.
  - `BOT_USERNAME` / `BOT_PASSWORD`: If no `BOT_USER_ID`, the bot ensures a user with this username exists (default `telegram`).
    If `BOT_PASSWORD` is not set, a random password is generated and printed to logs.

Notes

- Service Worker is disabled in dev; PWA is active in production builds.
- The API serves the built SPA in production when `dist/` exists.
