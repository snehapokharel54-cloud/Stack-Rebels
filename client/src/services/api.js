/**
 * services/api.js — Centralized API client for Grihastha backend
 * Handles JWT injection, error normalization, and multipart uploads.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/v1'

const TOKEN_KEY = 'grihastha_token'
const USER_KEY = 'grihastha_user'

// ── Token helpers ────────────────────────────────────────────────
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
export const setStoredUser = (user) =>
  localStorage.setItem(USER_KEY, JSON.stringify(user))

// ── Core fetch wrapper ───────────────────────────────────────────
async function request(method, path, { body, query, raw } = {}) {
  let url = `${API_BASE}${path}`

  // Append query params
  if (query) {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, v)
    })
    const qs = params.toString()
    if (qs) url += `?${qs}`
  }

  const headers = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const opts = { method, headers }

  if (body && !raw) {
    headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  } else if (body && raw) {
    // multipart — let browser set boundary
    opts.body = body
  }

  try {
    const res = await fetch(url, opts)
    const contentType = res.headers.get('content-type') || ''

    let data
    if (contentType.includes('application/json')) {
      data = await res.json()
    } else {
      data = { message: await res.text() }
    }

    if (!res.ok) {
      // Handle 401 — token expired/invalid
      if (res.status === 401) {
        clearToken()
        // Don't hard-redirect; let the calling code decide
      }

      // Build a useful error message — prefer field-level errors from express-validator
      let errMsg = data.message || data.error || `Request failed (${res.status})`
      if (data.errors?.length) {
        errMsg = data.errors.map(e => e.message || e.msg).join('. ')
      }

      return {
        success: false,
        status: res.status,
        message: errMsg,
        errors: data.errors || [],
        data: data.data || null,
      }
    }

    return {
      success: data.success !== undefined ? data.success : true,
      status: res.status,
      message: data.message || 'OK',
      ...data,
    }
  } catch (err) {
    return {
      success: false,
      status: 0,
      message: err.message || 'Network error — is the backend running?',
      data: null,
    }
  }
}

// ── Public API methods ───────────────────────────────────────────
const api = {
  get: (path, query) => request('GET', path, { query }),
  post: (path, body) => request('POST', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  delete: (path, body) => request('DELETE', path, { body }),

  /** Upload multipart/form-data (e.g., Cloudinary photos) */
  upload: (path, formData) => request('POST', path, { body: formData, raw: true }),
}

export default api
