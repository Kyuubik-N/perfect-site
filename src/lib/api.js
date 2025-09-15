const API_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE
    ? import.meta.env.VITE_API_BASE
    : ''

function makeUrl(path) {
  return (API_BASE || '') + path
}

async function request(path, opts = {}) {
  const { method = 'GET', body, headers = {}, signal } = opts
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  const h = isForm ? headers : { 'Content-Type': 'application/json', ...headers }

  const res = await fetch(makeUrl(path), {
    method,
    headers: h,
    credentials: 'include',
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
    signal,
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch (_) {}
  if (!res.ok) {
    const err = new Error(json?.error || res.statusText)
    err.status = res.status
    err.data = json
    throw err
  }
  return json
}

function uploadXHR(files, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', makeUrl('/api/upload'))
    xhr.withCredentials = true
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || '{}')
        if (xhr.status >= 200 && xhr.status < 300) resolve(data)
        else reject(Object.assign(new Error('upload_failed'), { status: xhr.status, data }))
      } catch (e) {
        reject(e)
      }
    }
    xhr.onerror = () => reject(new Error('network'))
    if (xhr.upload && typeof onProgress === 'function') {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    const fd = new FormData()
    for (const f of files) fd.append('file', f)
    xhr.send(fd)
  })
}

export const api = {
  ping: () => request('/api/ping'),
  me: () => request('/api/me'),

  notes: {
    list: () => request('/api/notes'),
    create: (data) => request('/api/notes', { method: 'POST', body: data }),
    remove: (id) => request(`/api/notes/${id}`, { method: 'DELETE' }),
  },

  files: {
    list: () => request('/api/files'),
    create: (data) => request('/api/files', { method: 'POST', body: data }),
    update: (id, data) => request(`/api/files/${id}`, { method: 'PATCH', body: data }),
    remove: (id) => request(`/api/files/${id}`, { method: 'DELETE' }),
    upload: (files, onProgress) => uploadXHR(files, onProgress),
  },

  calendar: {
    list: (from, to) => {
      const q = from && to ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : ''
      return request(`/api/calendar${q}`)
    },
    create: (data) => request('/api/calendar', { method: 'POST', body: data }),
    update: (id, data) => request(`/api/calendar/${id}`, { method: 'PATCH', body: data }),
    remove: (id) => request(`/api/calendar/${id}`, { method: 'DELETE' }),
    icsUrl: (from, to) => {
      const q = from && to ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : ''
      return makeUrl(`/api/calendar.ics${q}`)
    },
  },

  search: (q) => request(`/api/search?q=${encodeURIComponent(q || '')}`),

  og: (url, refresh = false) =>
    request(`/api/og?url=${encodeURIComponent(url)}${refresh ? '&refresh=1' : ''}`),

  tags: { list: () => request('/api/tags') },

  data: {
    export: () => request('/api/export'),
    import: (json) => request('/api/import', { method: 'POST', body: json }),
  },

  library: { list: () => request('/api/library') },

  auth: {
    login: (u, p) => request('/api/login', { method: 'POST', body: { username: u, password: p } }),
    register: (u, p) =>
      request('/api/register', { method: 'POST', body: { username: u, password: p } }),
    logout: () => request('/api/logout', { method: 'POST' }),
  },
}

export default api
