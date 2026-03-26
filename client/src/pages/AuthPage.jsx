import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
}

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  const roleFromQuery = searchParams.get('role')

  const [mode, setMode] = useState(initialMode)
  const [dir, setDir] = useState(1)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { login, signup, loading, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const signupRole = useMemo(() => {
    return roleFromQuery === 'vendor' ? 'vendor' : 'user'
  }, [roleFromQuery])

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'vendor' ? '/vendor' : '/home', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  const switchMode = (m) => {
    setDir(m === 'signup' ? 1 : -1)
    setMode(m)
    setError('')
    setSuccess('')
    const next = new URLSearchParams(searchParams)
    next.set('mode', m)
    if (m === 'login') {
      next.delete('role')
    } else {
      next.set('role', signupRole)
    }
    setSearchParams(next, { replace: true })
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.email || !form.password) return setError('Please fill in all fields.')
    if (mode === 'signup' && !form.name) return setError('Please enter your name.')

    if (mode === 'signup') {
      const result = await signup({
        name: form.name,
        email: form.email,
        password: form.password,
        role: signupRole,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      setMode('login')
      setDir(-1)
      setForm((prev) => ({ ...prev, password: '' }))
      setSuccess(signupRole === 'vendor' ? 'Host account created. Please log in.' : 'Account created. Please log in.')
      const next = new URLSearchParams(searchParams)
      next.set('mode', 'login')
      next.delete('role')
      setSearchParams(next, { replace: true })
      return
    }

    const result = await login({ email: form.email, password: form.password })
    if (!result.ok) {
      setError(result.error)
      return
    }

    navigate(result.user.role === 'vendor' ? '/vendor' : '/home', { replace: true })
  }

  const patch = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const inputStyle = {
    width: '100%', padding: '13px 16px 13px 42px', borderRadius: 12, border: '1.5px solid #e5e7eb',
    fontSize: 14, color: '#111827', background: '#fafafa', outline: 'none', fontFamily: "'Open Sans', sans-serif",
    boxSizing: 'border-box', transition: 'border-color 0.2s',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'Open Sans', sans-serif",
      background: 'linear-gradient(160deg, #f0f5ff 0%, #eaf4f0 50%, #f5efff 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* blobs */}
      <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: '#093880', opacity: 0.07, filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: '#63b74e', opacity: 0.08, filter: 'blur(80px)' }} />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: 440, position: 'relative' }}
      >
        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px)', borderRadius: 28, boxShadow: '0 24px 80px rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.6)', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '32px 36px 28px', background: 'linear-gradient(135deg, #093880, #1a56c4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <img src="/grihastha-logo.svg" alt="Grihastha" style={{ width: 36, height: 36, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 18, fontFamily: "'Poppins', sans-serif" }}>Grihastha</span>
            </div>
            <h1 style={{ fontFamily: "'Poppins', sans-serif", color: '#fff', fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
              {mode === 'login' ? 'Welcome back 👋' : signupRole === 'vendor' ? 'Create host account ✨' : 'Create account ✨'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 1.5 }}>
              {mode === 'login'
                ? 'Sign in to continue your journey'
                : signupRole === 'vendor'
                  ? 'Sign up first as a host, then log in to access host dashboard.'
                  : 'Join thousands of happy travelers'}
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: '32px 36px', minHeight: 300, position: 'relative', overflow: 'hidden' }}>
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div key={`form-${mode}`} custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28, ease: 'easeInOut' }}>
                <button
                  id="auth-back-btn"
                  type="button"
                  onClick={() => navigate('/')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, fontWeight: 600, marginBottom: 16, padding: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#111827'}
                  onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
                >
                  <FiArrowLeft size={15} /> Back
                </button>

                {/* Mode toggle */}
                <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 12, padding: 4, marginBottom: 28 }}>
                  {['login', 'signup'].map(m => (
                    <button
                      key={m}
                      id={`auth-${m}-tab`}
                      onClick={() => switchMode(m)}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                        background: mode === m ? '#fff' : 'transparent',
                        color: mode === m ? '#093880' : '#6b7280',
                        boxShadow: mode === m ? '0 1px 8px rgba(0,0,0,0.08)' : 'none',
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      {m === 'login' ? 'Log In' : 'Sign Up'}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleFormSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {mode === 'signup' && (
                      <div style={{ position: 'relative' }}>
                        <FiUser style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} size={16} />
                        <input id="auth-name" type="text" placeholder="Full name" value={form.name} onChange={patch('name')}
                          style={inputStyle}
                          onFocus={e => e.target.style.borderColor = '#093880'}
                          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        />
                      </div>
                    )}
                    <div style={{ position: 'relative' }}>
                      <FiMail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} size={16} />
                      <input id="auth-email" type="email" placeholder="Email address" value={form.email} onChange={patch('email')}
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = '#093880'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <FiLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} size={16} />
                      <input id="auth-password" type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={patch('password')}
                        style={{ ...inputStyle, paddingRight: 44 }}
                        onFocus={e => e.target.style.borderColor = '#093880'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                      />
                      <button type="button" onClick={() => setShowPass(s => !s)}
                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                        {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>

                    {error && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, fontWeight: 500 }}>
                        {error}
                      </div>
                    )}

                    {success && (
                      <div style={{ background: '#ecfdf3', border: '1px solid #86efac', borderRadius: 10, padding: '10px 14px', color: '#15803d', fontSize: 13, fontWeight: 500 }}>
                        {success}
                      </div>
                    )}

                    <motion.button
                      id="auth-continue-btn"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(9,56,128,0.3)', fontFamily: "'Poppins', sans-serif", marginTop: 4, opacity: loading ? 0.8 : 1 }}
                    >
                      {loading ? 'Please wait...' : mode === 'signup' ? 'Sign Up' : 'Log In'}
                    </motion.button>
                  </div>
                </form>

                {mode === 'signup' && (
                  <p style={{ marginTop: 14, fontSize: 12, color: '#6b7280' }}>
                    Signing up as: <strong>{signupRole === 'vendor' ? 'Host' : 'Guest'}</strong>
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div style={{ padding: '0 36px 28px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
            By continuing, you agree to our{' '}
            <span style={{ color: '#093880', cursor: 'pointer', textDecoration: 'underline' }}>Terms</span>{' '}and{' '}
            <span style={{ color: '#093880', cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
