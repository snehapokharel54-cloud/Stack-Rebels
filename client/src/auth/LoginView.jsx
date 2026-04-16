/**
 * auth/LoginView.jsx — Clean login with Google, email+password, remember me, forgot password
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiMail, FiArrowLeft, FiShield } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { AuthInput, PasswordInput } from './AuthInput'
import AuthCard from './AuthCard'
import AuthHeader from './AuthHeader'

export default function LoginView({ onSwitchToSignup, onForgotPassword }) {
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [errors, setErrors] = useState({})
  const { login, loading } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const patch = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.email.includes('@')) e.email = 'Enter a valid email address.'
    if (!form.password) e.password = 'Password is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const result = await login({ email: form.email, password: form.password })
    if (!result.ok) {
      setErrors({ submit: result.error })
      return
    }
    showToast(`Welcome back, ${result.user.name?.split(' ')[0]}! 👋`, 'success')
    navigate(result.user.role === 'vendor' ? '/vendor' : '/home', { replace: true })
  }

  return (
    <AuthCard maxWidth={440}>
      <AuthHeader title="Welcome back" subtitle="Sign in to continue your journey" />

      <div style={{ padding: '28px 36px 24px' }}>
        {/* Back to landing */}
        <button type="button" onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 20 }}
          onMouseEnter={e => e.currentTarget.style.color = '#111827'}
          onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
          <FiArrowLeft size={14} /> Back to home
        </button>

        {/* Google */}
        <button type="button"
          onClick={() => showToast('Google sign-in coming soon!', 'info')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4, transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
          <FcGoogle size={20} /> Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>or continue with email</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <AuthInput id="login-email" icon={FiMail} type="email" placeholder="Email address" value={form.email} onChange={patch('email')} error={errors.email} />
            <PasswordInput id="login-password" value={form.password} onChange={patch('password')} error={errors.password} />

            {/* Remember me + Forgot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '-2px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                <input type="checkbox" checked={form.remember} onChange={e => setForm(f => ({ ...f, remember: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#093880' }} />
                Remember me
              </label>
              <button type="button" onClick={onForgotPassword}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#093880', fontSize: 13, fontWeight: 600, textDecoration: 'underline' }}>
                Forgot password?
              </button>
            </div>

            {errors.submit && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>
                {errors.submit}
              </div>
            )}

            <motion.button id="login-submit" type="submit" disabled={loading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(9,56,128,0.28)', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.8 : 1 }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</> : 'Log In'}
            </motion.button>
          </div>
        </form>

        {/* Trust */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
          <FiShield size={13} style={{ color: '#16a34a' }} />
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            Your data is <strong style={{ color: '#374151' }}>encrypted & secure</strong>
          </span>
        </div>
      </div>

      <div style={{ padding: '0 36px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#6b7280' }}>
          Don't have an account?{' '}
          <button type="button" onClick={onSwitchToSignup}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#093880', fontWeight: 700, fontSize: 13, textDecoration: 'underline' }}>
            Sign up free
          </button>
        </p>
        <p style={{ fontSize: 11, color: '#d1d5db', marginTop: 8 }}>
          By continuing you agree to our{' '}
          <span style={{ color: '#093880', cursor: 'pointer' }}>Terms</span> &{' '}
          <span style={{ color: '#093880', cursor: 'pointer' }}>Privacy Policy</span>
        </p>
      </div>
    </AuthCard>
  )
}
