import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI, userAPI, setToken, getToken, clearToken, setUnauthorizedHandler } from '../services/api'

const AuthContext = createContext(null)
const AUTH_STORAGE_KEY = 'grihastha_user'

// Map backend role names to frontend role names
const mapRoleFromAPI = (role) => {
  if (role === 'host') return 'vendor'
  if (role === 'admin') return 'admin'
  return 'user'
}

// Map frontend role names to backend role names
const mapRoleToAPI = (role) => {
  if (role === 'vendor') return 'host'
  return role
}

/**
 * Extracts a normalized user session from the API login/signup response.
 * Handles the different response shapes from user/host/admin endpoints.
 */
function extractUserSession(responseData, role) {
  const apiUser = responseData.user || responseData.admin
  const token = responseData.token

  if (!apiUser || !token) return null

  const frontendRole = mapRoleFromAPI(role)

  return {
    id: apiUser.id,
    name: apiUser.full_name || apiUser.name || 'User',
    email: apiUser.email,
    role: frontendRole,
    avatar: (apiUser.full_name || apiUser.name || 'U').charAt(0).toUpperCase(),
    avatar_url: apiUser.avatar_url || null,
    phone: apiUser.phone || '',
    phoneVerified: !!apiUser.phone,
    idVerified: apiUser.is_verified || false,
    is_host: apiUser.is_host || false,
    is_superhost: apiUser.is_superhost || false,
    badges: [
      ...(apiUser.phone ? ['phone_verified'] : []),
      ...(apiUser.is_verified ? ['id_verified'] : []),
      ...(frontendRole === 'vendor' ? ['host'] : []),
      ...(frontendRole === 'admin' ? ['admin'] : []),
      ...(frontendRole === 'user' ? ['guest'] : []),
    ],
    created_at: apiUser.created_at,
    token,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      // Ensure the token is set in the API layer
      if (parsed?.token) setToken(parsed.token)
      return parsed
    } catch {
      return null
    }
  })

  const [loading, setLoading] = useState(false)

  // Register the 401 handler to auto-logout
  useEffect(() => {
    setUnauthorizedHandler(() => {
      console.warn('[Auth] Received 401 — logging out')
      setUser(null)
      clearToken()
      localStorage.removeItem(AUTH_STORAGE_KEY)
    })
  }, [])

  // Persist session to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      if (user.token) setToken(user.token)
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      clearToken()
    }
  }, [user])

  // ─── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    setLoading(true)
    try {
      let response

      if (email.toLowerCase() === 'admin@grihastha.com') {
        response = await authAPI.adminLogin({ email, password })
      } else {
        response = await authAPI.userLogin({ email, password })
      }

      const { data } = response
      if (!data.success) {
        return { ok: false, error: data.message || 'Login failed.' }
      }

      // Determine the actual role from the response or email
      const actualRole = email.toLowerCase() === 'admin@grihastha.com' ? 'admin' : (data.data.user?.is_host ? 'host' : 'user')
      const session = extractUserSession(data.data, actualRole)

      if (!session) {
        return { ok: false, error: 'Failed to parse login response.' }
      }

      setUser(session)
      return { ok: true, user: session }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed.'
      return { ok: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  // ─── Signup ─────────────────────────────────────────────────────────────────
  const signup = useCallback(async ({
    name, email, password, role = 'user',
    phone = '',
  }) => {
    setLoading(true)
    try {
      const apiRole = mapRoleToAPI(role)
      const payload = {
        full_name: name,
        email,
        password,
        phone: phone || undefined,
      }

      let response
      if (apiRole === 'host') {
        response = await authAPI.hostSignup(payload)
      } else {
        response = await authAPI.userSignup(payload)
      }

      const { data } = response
      if (!data.success) {
        return { ok: false, error: data.message || 'Signup failed.' }
      }

      if (data.data && data.data.signupToken) {
        return { ok: true, signupToken: data.data.signupToken }
      }

      const actualRole = apiRole === 'host' ? 'host' : 'user'
      const session = extractUserSession(data.data, actualRole)

      if (!session) {
        return { ok: false, error: 'Failed to parse signup response.' }
      }

      setUser(session)
      return { ok: true, user: session, account: session }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Signup failed.'
      return { ok: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  // ─── Verify Email ───────────────────────────────────────────────────────────
  const verifyEmail = useCallback(async ({ email, otp, signupToken, role = 'user' }) => {
    setLoading(true)
    try {
      if (signupToken) {
        const apiRole = mapRoleToAPI(role)
        const fn = apiRole === 'host' ? authAPI.hostSignupComplete : authAPI.userSignupComplete
        const { data } = await fn({ signupToken, otp })
        
        if (data.success && data.data) {
          const session = extractUserSession(data.data, apiRole)
          if (session) setUser(session)
        }
        
        return { ok: data.success, message: data.message }
      }
      
      const apiRole = mapRoleToAPI(role)
      const fn = apiRole === 'host' ? authAPI.hostVerifyEmail : authAPI.userVerifyEmail
      const { data } = await fn({ email, otp })
      return { ok: data.success, message: data.message }
    } catch (error) {
      return { ok: false, error: error.response?.data?.message || 'Verification failed.' }
    } finally {
      setLoading(false)
    }
  }, [])

  // ─── Forgot Password ───────────────────────────────────────────────────────
  const forgotPassword = useCallback(async ({ email, role = 'user' }) => {
    setLoading(true)
    try {
      const apiRole = mapRoleToAPI(role)
      let fn
      if (apiRole === 'admin') fn = authAPI.adminLogin // admin uses separate flow
      else if (apiRole === 'host') fn = authAPI.hostForgotPassword
      else fn = authAPI.userForgotPassword

      const { data } = await fn({ email })
      return { ok: data.success, message: data.message }
    } catch (error) {
      return { ok: false, error: error.response?.data?.message || 'Request failed.' }
    } finally {
      setLoading(false)
    }
  }, [])

  // ─── Reset Password ────────────────────────────────────────────────────────
  const resetPassword = useCallback(async ({ token, password, role = 'user' }) => {
    setLoading(true)
    try {
      const apiRole = mapRoleToAPI(role)
      const fn = apiRole === 'host' ? authAPI.hostResetPassword : authAPI.userResetPassword
      const { data } = await fn({ token, password })
      return { ok: data.success, message: data.message }
    } catch (error) {
      return { ok: false, error: error.response?.data?.message || 'Reset failed.' }
    } finally {
      setLoading(false)
    }
  }, [])

  // ─── Refresh user profile from API ──────────────────────────────────────────
  const refreshProfile = useCallback(async () => {
    if (!user?.token) return
    try {
      const { data } = await userAPI.getProfile()
      if (data.success && data.data) {
        setUser(prev => ({
          ...prev,
          name: data.data.full_name || prev.name,
          email: data.data.email || prev.email,
          phone: data.data.phone || prev.phone,
          avatar_url: data.data.avatar_url || prev.avatar_url,
          idVerified: data.data.is_verified || prev.idVerified,
          is_superhost: data.data.is_superhost || prev.is_superhost,
        }))
      }
    } catch (error) {
      console.warn('Failed to refresh profile:', error.message)
    }
  }, [user?.token])

  // ─── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setUser(null)
    clearToken()
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem('grihastha_notifications')
    localStorage.removeItem('grihastha_bookings')
    localStorage.removeItem('grihastha_wishlist')
    localStorage.removeItem('grihastha_host_properties')
    localStorage.removeItem('grihastha_admin_users')
  }, [])

  // ─── Update user (local state) ──────────────────────────────────────────────
  const updateUser = useCallback((updates) => {
    const safe = { ...updates }
    if (safe.role === 'admin') delete safe.role
    setUser(prev => prev ? { ...prev, ...safe } : prev)
  }, [])

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{
      user,
      accounts: [], // backward compat for AdminDashboard (will be replaced in Phase 6 with API)
      signup,
      login,
      logout,
      loading,
      isAuthenticated,
      updateUser,
      verifyEmail,
      forgotPassword,
      resetPassword,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
