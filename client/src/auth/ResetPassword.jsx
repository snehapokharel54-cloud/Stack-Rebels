import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiLock, FiArrowLeft, FiCheckCircle } from 'react-icons/fi'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { AuthInput } from './AuthInput'
import AuthCard from './AuthCard'
import AuthHeader from './AuthHeader'
import { useSearchParams } from 'react-router-dom'

export default function ResetPassword({ onBack }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { showToast } = useToast()
  const { resetPassword } = useAuth()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const handleReset = async () => {
    if (password.length < 6) { setPasswordError('At least 6 characters required.'); return }
    if (password !== confirmPassword) { setConfirmError('Passwords do not match.'); return }
    
    setPasswordError('')
    setConfirmError('')
    setLoading(true)
    try {
      const result = await resetPassword({ token, password })
      if (result.ok) {
        showToast('Password reset successfully!', 'success')
        setDone(true)
      } else {
        showToast(result.error || 'Failed to reset password.', 'error')
      }
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error')
    }
    setLoading(false)
  }

  return (
    <AuthCard maxWidth={420}>
      <AuthHeader
        title={done ? 'Success!' : 'Reset your password'}
        subtitle={done
          ? 'Your password has been updated. You can now log in.'
          : 'Enter your new password below.'}
      />

      <div style={{ padding: '28px 36px 32px' }}>
        <button type="button" onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 24 }}
          onMouseEnter={e => e.currentTarget.style.color = '#111827'}
          onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
          <FiArrowLeft size={14} /> Back to login
        </button>

        {!done ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <AuthInput
              id="reset-password"
              icon={FiLock}
              type="password"
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              error={passwordError}
            />
            <AuthInput
              id="reset-confirm-password"
              icon={FiLock}
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              error={confirmError}
            />
            <motion.button type="button"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleReset} disabled={loading || !token}
              style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(9,56,128,0.28)', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (loading || !token) ? 0.8 : 1 }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Resetting…</> : <>Reset Password</>}
            </motion.button>
            {!token && (
              <p style={{ color: '#ef4444', fontSize: 12, textAlign: 'center' }}>
                Invalid or missing token.
              </p>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              style={{ width: 72, height: 72, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 20px rgba(22,163,74,0.2)' }}>
              <FiCheckCircle size={32} style={{ color: '#16a34a' }} />
            </motion.div>
            <p style={{ fontSize: 14, color: '#374151', marginBottom: 20 }}>
              Your password has been reset successfully!
            </p>
            <button type="button" onClick={onBack}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: '#093880', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Log In Now
            </button>
          </div>
        )}
      </div>
    </AuthCard>
  )
}
