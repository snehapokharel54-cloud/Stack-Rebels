import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)
const AUTH_STORAGE_KEY = 'grihastha_user'
const LEGACY_AUTH_STORAGE_KEY = 'nestaway_user'
const ACCOUNTS_STORAGE_KEY = 'grihastha_accounts'

const normalizeEmail = (email = '') => email.trim().toLowerCase()

// ─── Single source of truth for admin credentials ────────────────────────────
// These are the ONLY valid admin credentials. Any session claiming admin role
// that does NOT originate from these credentials will be stripped.
const ADMIN_EMAIL = 'admin@grihastha.com'
const ADMIN_PASSWORD = 'admin123'

// ─── Pre-seeded demo accounts (always available, no signup needed) ────────────
const DEFAULT_ACCOUNTS = [
  {
    name: 'Demo Guest',
    email: 'guest@grihastha.com',
    password: 'guest123',
    role: 'user',
    phone: '9800000001',
    phoneVerified: true,
    idVerified: true,
    propName: '', propLocation: '', propDesc: '',
    createdAt: '2025-01-01T00:00:00.000Z',
    badges: ['phone_verified', 'id_verified', 'guest'],
  },
  {
    name: 'Demo Host',
    email: 'host@grihastha.com',
    password: 'host123',
    role: 'vendor',
    phone: '9800000002',
    phoneVerified: true,
    idVerified: true,
    propName: 'Sunset Villa', propLocation: 'Pokhara', propDesc: 'Lakeside property',
    createdAt: '2025-01-01T00:00:00.000Z',
    badges: ['phone_verified', 'id_verified', 'host'],
  },
]

/**
 * Validates a user session object. If the session claims to be admin but
 * the email doesn't match the real admin email, we forcibly clear it.
 * This prevents localStorage tampering (e.g. manually setting role: "admin").
 */
function validateSession(session) {
  if (!session) return null
  // If stored session claims admin role but email doesn't match — reject it
  if (session.role === 'admin' && normalizeEmail(session.email) !== normalizeEmail(ADMIN_EMAIL)) {
    return null
  }
  // Regular users/vendors must not have admin role
  if (session.role !== 'user' && session.role !== 'vendor' && session.role !== 'admin') {
    return null
  }
  return session
}

const loadAccounts = () => {
  try {
    const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    const userAccounts = Array.isArray(parsed) ? parsed.filter(acc => acc.role !== 'admin') : []

    // Merge DEFAULT_ACCOUNTS — add them only if not already present
    const merged = [...userAccounts]
    for (const def of DEFAULT_ACCOUNTS) {
      const exists = merged.some(a => normalizeEmail(a.email) === normalizeEmail(def.email))
      if (!exists) merged.push(def)
    }
    return merged
  } catch {
    return [...DEFAULT_ACCOUNTS]
  }
}

export function AuthProvider({ children }) {
  const [accounts, setAccounts] = useState(loadAccounts)

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(LEGACY_AUTH_STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      // Run validation to prevent tampered sessions
      return validateSession(parsed)
    } catch {
      return null
    }
  })

  const [loading, setLoading] = useState(false)

  // Persist session — but never persist a fraudulent admin session
  useEffect(() => {
    if (user) {
      // Final safety: if user.role === admin but email doesn't match, log out
      if (user.role === 'admin' && normalizeEmail(user.email) !== normalizeEmail(ADMIN_EMAIL)) {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
        setUser(null)
        return
      }
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
    }
  }, [user])

  useEffect(() => {
    // Never store accounts with admin role
    const safe = accounts.filter(acc => acc.role !== 'admin')
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(safe))
  }, [accounts])

  /**
   * signup — does NOT allow admin role to be registered
   */
  const signup = ({
    name, email, password, role,
    phone = '', phoneVerified = false,
    idVerified = false,
    propName = '', propLocation = '', propDesc = '',
  }) => {
    setLoading(true)
    return new Promise((resolve) => {
      setTimeout(() => {
        const normalizedEmail = normalizeEmail(email)

        // Block: cannot sign up with admin email or admin role
        if (normalizedEmail === normalizeEmail(ADMIN_EMAIL)) {
          setLoading(false)
          resolve({ ok: false, error: 'This email is reserved. Please use a different email.' })
          return
        }
        if (role === 'admin') {
          setLoading(false)
          resolve({ ok: false, error: 'Invalid role.' })
          return
        }

        const exists = accounts.some((acc) => normalizeEmail(acc.email) === normalizedEmail)
        if (exists) {
          setLoading(false)
          resolve({ ok: false, error: 'Account already exists with this email.' })
          return
        }

        const newAccount = {
          name: name.trim(),
          email: normalizedEmail,
          password,
          // Forcibly clamp role — cannot be admin
          role: role === 'vendor' ? 'vendor' : 'user',
          phone,
          phoneVerified,
          idVerified,
          propName,
          propLocation,
          propDesc,
          createdAt: new Date().toISOString(),
          badges: [
            ...(phoneVerified ? ['phone_verified'] : []),
            ...(idVerified ? ['id_verified'] : []),
            ...(role === 'vendor' ? ['host'] : ['guest']),
          ],
        }

        setAccounts((prev) => [...prev, newAccount])
        setLoading(false)
        resolve({ ok: true, account: newAccount })
      }, 800)
    })
  }

  const login = ({ email, password }) => {
    setLoading(true)
    return new Promise((resolve) => {
      setTimeout(() => {
        const normalizedEmail = normalizeEmail(email)

        // ── Admin credential check (EXACT match required) ─────────────────
        if (normalizedEmail === normalizeEmail(ADMIN_EMAIL)) {
          if (password === ADMIN_PASSWORD) {
            // Correct admin credentials → grant admin session
            const adminSession = {
              name: 'Administrator',
              email: ADMIN_EMAIL,
              role: 'admin',
              avatar: 'A',
              phone: '',
              phoneVerified: true,
              idVerified: true,
              badges: ['admin'],
            }
            setUser(adminSession)
            setLoading(false)
            resolve({ ok: true, user: adminSession })
          } else {
            // Admin email but wrong password → deny, no hint
            setLoading(false)
            resolve({ ok: false, error: 'Invalid email or password.' })
          }
          return
        }

        // ── Regular account lookup ────────────────────────────────────────
        const account = accounts.find(
          (acc) =>
            normalizeEmail(acc.email) === normalizedEmail &&
            acc.password === password &&
            acc.role !== 'admin', // extra guard: skip any tampered account with admin role
        )

        if (!account) {
          setLoading(false)
          resolve({ ok: false, error: 'Invalid email or password.' })
          return
        }

        const userData = {
          name: account.name,
          email: account.email,
          // Clamp role — regular accounts can only be user or vendor
          role: account.role === 'vendor' ? 'vendor' : 'user',
          avatar: account.name?.charAt(0)?.toUpperCase(),
          phone: account.phone || '',
          phoneVerified: account.phoneVerified || false,
          idVerified: account.idVerified || false,
          badges: (account.badges || []).filter(b => b !== 'admin'),
          propName: account.propName || '',
          propLocation: account.propLocation || '',
        }

        setUser(userData)
        setLoading(false)
        resolve({ ok: true, user: userData })
      }, 800)
    })
  }

  const logout = () => {
    setUser(null)
  }

  const updateUser = (updates) => {
    // Never allow role upgrade to admin via updateUser
    const safe = { ...updates }
    if (safe.role === 'admin') delete safe.role
    setUser(prev => prev ? { ...prev, ...safe } : prev)
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, accounts, signup, login, logout, loading, isAuthenticated, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
