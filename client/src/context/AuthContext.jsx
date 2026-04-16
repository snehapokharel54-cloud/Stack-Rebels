import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)
const AUTH_STORAGE_KEY = 'grihastha_user'
const LEGACY_AUTH_STORAGE_KEY = 'nestaway_user'
const ACCOUNTS_STORAGE_KEY = 'grihastha_accounts'

const normalizeEmail = (email = '') => email.trim().toLowerCase()

const loadAccounts = () => {
  try {
    const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function AuthProvider({ children }) {
  const [accounts, setAccounts] = useState(loadAccounts)

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(LEGACY_AUTH_STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
    }
  }, [user])

  useEffect(() => {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts))
  }, [accounts])

  /**
   * signup — stores an account with extended profile fields
   * @param {{ name, email, password, role, phone?, idFile?, propName?, propLocation?, propDesc? }} params
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
          role,
          phone,
          phoneVerified,
          idVerified,
          // host-specific
          propName,
          propLocation,
          propDesc,
          createdAt: new Date().toISOString(),
          // verification badges
          badges: [
            ...(phoneVerified ? ['phone_verified'] : []),
            ...(idVerified ? ['id_verified'] : []),
            ...(role === 'vendor' ? ['host'] : ['guest']),
          ],
        }

        setAccounts((prev) => [...prev, newAccount])
        setLoading(false)
        resolve({ ok: true })
      }, 800)
    })
  }

  const login = ({ email, password }) => {
    setLoading(true)
    return new Promise((resolve) => {
      setTimeout(() => {
        const normalizedEmail = normalizeEmail(email)
        const account = accounts.find(
          (acc) => normalizeEmail(acc.email) === normalizedEmail && acc.password === password,
        )

        if (!account) {
          setLoading(false)
          resolve({ ok: false, error: 'Invalid email or password.' })
          return
        }

        const userData = {
          name: account.name,
          email: account.email,
          role: account.role,
          avatar: account.name?.charAt(0)?.toUpperCase(),
          phone: account.phone || '',
          phoneVerified: account.phoneVerified || false,
          idVerified: account.idVerified || false,
          badges: account.badges || [],
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

  /** Update profile fields in-memory and localStorage */
  const updateUser = (updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev)
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, signup, login, logout, loading, isAuthenticated, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
