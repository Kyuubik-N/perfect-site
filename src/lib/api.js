const DEFAULT_TIMEOUT = 12000

async function doFetch(url, { method, body, headers, timeout }) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort('timeout'), timeout)
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    })
    return res
  } finally {
    clearTimeout(t)
  }
}

function toErrorMessage(resStatus, data) {
  return (data && (data.error || data.message || data.raw)) || `HTTP ${resStatus}`
}

async function parseResponse(res) {
  let data = null
  if (res.status !== 204) {
    const txt = await res.text()
    try {
      data = txt ? JSON.parse(txt) : null
    } catch {
      data = { raw: txt }
    }
  }
  if (!res.ok) throw new Error(toErrorMessage(res.status, data))
  return data
}

export async function api(
  path,
  { method = 'GET', body, headers = {}, timeout = DEFAULT_TIMEOUT } = {},
) {
  const opts = { method, body, headers, timeout }
  const userBase =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
    (typeof window !== 'undefined' && window.__API_BASE__)

  try {
    // 1) Try relative path (Vite proxy in dev or same-origin in prod)
    const res = await doFetch(path, opts)
    return await parseResponse(res)
  } catch (e) {
    if (e && e.name === 'AbortError') throw new Error('timeout')
    // 2) If custom base provided, try it
    if (userBase && typeof userBase === 'string') {
      try {
        return await parseResponse(await doFetch(userBase + path, opts))
      } catch (e2) {
        if (e2 && e2.name === 'AbortError') throw new Error('timeout')
      }
    }
    // 3) Dev fallback directly to API port
    const hosts = []
    if (typeof window !== 'undefined' && window.location && window.location.hostname)
      hosts.push(window.location.hostname)
    hosts.push('127.0.0.1', 'localhost')
    for (const h of hosts) {
      try {
        const base = `http://${h}:5174`
        const res2 = await doFetch(base + path, opts)
        return await parseResponse(res2)
      } catch (e2) {
        if (e2 && e2.name === 'AbortError') throw new Error('timeout')
        // continue to next host
      }
    }
    throw new Error('network')
  }
}
