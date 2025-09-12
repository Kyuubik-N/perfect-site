// Унифицированный fetch с аккуратной обработкой ошибок.
// Не считает 4xx "сетевой ошибкой" — кидает Error с .status/.code/.details

export async function api(path, opts = {}) {
  const url = path.startsWith('http') ? path : path
  const headers = new Headers(opts.headers || {})
  let body = opts.body

  // Если передали FormData — не проставляем Content-Type
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  if (body && !isFormData) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(url, {
      method: opts.method || 'GET',
      credentials: 'include',
      headers,
      body,
    })
  } catch (e) {
    const err = new Error('Сетевая ошибка. Проверьте подключение.')
    err.code = 'network'
    throw err
  }

  const raw = await res.text().catch(() => '')
  let data = null
  try {
    data = raw ? JSON.parse(raw) : null
  } catch {
    data = { message: raw }
  }

  if (!res.ok) {
    const map = {
      400: 'bad_request',
      401: 'unauthorized',
      403: 'forbidden',
      404: 'not_found',
      409: 'conflict',
      422: 'validation_error',
      500: 'server_error',
    }
    const err = new Error(
      (data && (data.message || data.error || data.code)) ||
        (res.status === 409
          ? 'Имя пользователя уже занято'
          : res.status === 401
            ? 'Неверный логин или пароль'
            : 'Ошибка запроса'),
    )
    err.status = res.status
    err.code = (data && (data.code || data.error)) || map[res.status] || 'http_error'
    err.details = data
    throw err
  }

  return data
}

// Хелпер для JSON-POST
export const post = (path, body, extra) => api(path, { method: 'POST', body, ...(extra || {}) })
