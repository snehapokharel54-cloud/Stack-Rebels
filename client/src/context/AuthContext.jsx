/**
 * context/AuthContext.jsx — JWT-based auth against Grihastha backend
 *
 * Roles: frontend uses "user"/"vendor", backend uses "user"/"host"
 * We map vendor → host for API calls.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api, { getToken, setToken, clearToken, getStoredUser, setStoredUser } from '../services/api'

const AuthContext = createContext(null)

/** Map frontend role names to backend API path segments */
const roleToEndpoint = (role) => {
  if (role === 'vendor' || role === 'host') return 'host'
  if (role === 'admin') return 'admin'
  return 'user'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  // ── Rehydrate user from token on mount ──────────────────────
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setInitializing(false)
      return
    }
    api.get('/users/me').then((res) => {
      if (res.success && res.data) {
        const userData = normalizeUser(res.data)
        setUser(userData)
        setStoredUser(userData)
      } else {
        // Token invalid
        clearToken()
        setUser(null)
      }
      setInitializing(false)
    })
  }, [])

  // ── Persist user to localStorage on change ──────────────────
  useEffect(() => {
    if (user) {
      setStoredUser(user)
    }
  }, [user])

  // ── Normalize backend user object to frontend shape ─────────
  const normalizeUser = (userObj) => ({
    id: userObj.id,
    name: userObj.full_name,
    email: userObj.email,
    role: userObj.is_host ? 'vendor' : userObj.role === 'ADMIN' ? 'admin' : 'user',
    avatar: userObj.avatar_url || userObj.full_name?.charAt(0)?.toUpperCase(),
    avatarUrl: userObj.avatar_url || null,
    phone: userObj.phone || '',
    bio: userObj.bio || '',
    isVerified: userObj.is_verified || false,
    isSuperhost: userObj.is_superhost || false,
    preferredCurrency: userObj.preferred_currency || 'NPR',
    createdAt: userObj.created_at,
  })

  // ── Signup ──────────────────────────────────────────────────
  const signup = useCallback(async ({ email, full_name, password, phone, role, document }) => {
    setLoading(true)
    try {
      const endpoint = roleToEndpoint(role)
      let res;

      if (document) {
        const formData = new FormData()
        formData.append('email', email)
        formData.append('full_name', full_name)
        formData.append('password', password)
        if (phone?.trim()) formData.append('phone', phone.trim())
        if (document) formData.append('document', document)
        res = await api.upload(`/auth/${endpoint}/signup`, formData)
      } else {
        const body = { email, full_name, password }
        if (phone?.trim()) body.phone = phone.trim()
        res = await api.post(`/auth/${endpoint}/signup`, body)
      }
      if (!res.success) {
        return { ok: false, error: res.message }
      }
      return { ok: true, needsVerification: true, email }
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Verify Email OTP ────────────────────────────────────────
  const verifyEmail = useCallback(async ({ email, otp, role }) => {
    setLoading(true)
    try {
      const endpoint = roleToEndpoint(role)
      const res = await api.post(`/auth/${endpoint}/verify-email`, { email, otp })
      if (!res.success) {
        return { ok: false, error: res.message }
      }
      // After verification, the backend may return a token
      const token = res.token || res.data?.token;
      const user = res.user || res.data?.user;
      
      if (token) {
        setToken(token)
        if (user) {
          const userData = normalizeUser(user)
          setUser(userData)
          setStoredUser(userData)
        }
      }
      return { ok: true }
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Login ───────────────────────────────────────────────────
  const login = useCallback(async ({ email, password, role }) => {
    setLoading(true)
    try {
      const endpoint = roleToEndpoint(role || 'user')
      const res = await api.post(`/auth/${endpoint}/login`, { email, password })
      if (!res.success) {
        return { ok: false, error: res.message }
      }
      
      const token = res.token || res.data?.token;
      const user = res.user || res.data?.user;

      // Store token
      if (token) {
        setToken(token)
      }
      // Build user data
      const userData = user ? normalizeUser(user) : { email, role: role || 'user' }
      setUser(userData)
      setStoredUser(userData)
      return { ok: true, user: userData }
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Logout ──────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  // ── Fetch / refresh profile ─────────────────────────────────
  const fetchProfile = useCallback(async () => {
    const res = await api.get('/users/me')
    if (res.success && res.data) {
      const userData = normalizeUser(res.data)
      setUser(userData)
      setStoredUser(userData)
      return userData
    }
    return null
  }, [])

  // ── Update profile ─────────────────────────────────────────
  const updateUser = useCallback(async (updates) => {
    const res = await api.patch('/users/me', updates)
    if (res.success) {
      // Refresh profile from server
      await fetchProfile()
      return { ok: true }
    }
    return { ok: false, error: res.message }
  }, [fetchProfile])

  // ── Forgot password ─────────────────────────────────────────
  const forgotPassword = useCallback(async ({ email, role }) => {
    const endpoint = roleToEndpoint(role || 'user')
    const res = await api.post(`/auth/${endpoint}/forgot-password`, { email })
    return res.success ? { ok: true } : { ok: false, error: res.message }
  }, [])

  // ── Reset password ──────────────────────────────────────────
  const resetPassword = useCallback(async ({ token, password, role }) => {
    const endpoint = roleToEndpoint(role || 'user')
    const res = await api.post(`/auth/${endpoint}/reset-password`, { token, password })
    return res.success ? { ok: true } : { ok: false, error: res.message }
  }, [])

  const isAuthenticated = !!user && !!getToken()

  return (
    <AuthContext.Provider
      value={{
        user,
        signup,
        verifyEmail,
        login,
        logout,
        loading,
        initializing,
        isAuthenticated,
        updateUser,
        fetchProfile,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
