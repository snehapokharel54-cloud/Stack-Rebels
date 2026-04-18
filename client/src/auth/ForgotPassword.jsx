/**
 * auth/ForgotPassword.jsx — Email reset flow with "check your inbox" state
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiMail, FiArrowLeft, FiCheckCircle, FiRefreshCw } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { AuthInput } from './AuthInput'
import AuthCard from './AuthCard'
import AuthHeader from './AuthHeader'

export default function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendCd, setResendCd] = useState(0)
  const { forgotPassword } = useAuth()
  const { showToast } = useToast()

  const handleSend = async () => {
    if (!email.includes('@')) { setEmailError('Enter a valid email address.'); return }
    setEmailError('')
    setLoading(true)
    const result = await forgotPassword({ email })
    setLoading(false)
    if (result.ok) {
      setSent(true)
      setResendCd(60)
      showToast('Password reset email sent!', 'success')
      const interval = setInterval(() => setResendCd(c => { if (c <= 1) { clearInterval(interval); return 0 } return c - 1 }), 1000)
    } else {
      setEmailError(result.error || 'Failed to send reset email.')
    }
  }

  const handleResend = async () => {
    if (resendCd > 0) return
    setLoading(true)
    const result = await forgotPassword({ email })
    setLoading(false)
    if (result.ok) {
      setResendCd(60)
      showToast('Resent! Check your inbox.', 'info')
      const interval = setInterval(() => setResendCd(c => { if (c <= 1) { clearInterval(interval); return 0 } return c - 1 }), 1000)
    } else {
      showToast(result.error || 'Failed to resend.', 'error')
    }
  }

  return (
    <AuthCard maxWidth={420}>
      <AuthHeader
        title={sent ? 'Check your email' : 'Forgot password?'}
        subtitle={sent
          ? `We sent a reset link to ${email}. Check your inbox (and spam).`
          : "Enter your email and we'll send you a reset link."}
      />

      <div style={{ padding: '28px 36px 32px' }}>
        <button type="button" onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 24 }}
          onMouseEnter={e => e.currentTarget.style.color = '#111827'}
          onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
          <FiArrowLeft size={14} /> Back to login
        </button>

        {!sent ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <AuthInput
              id="forgot-email"
              icon={FiMail}
              type="email"
              placeholder="Your account email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              error={emailError}
            />
            <motion.button type="button"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSend} disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(9,56,128,0.28)', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.8 : 1 }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Sending…</> : <>Send Reset Link <FiMail size={14} /></>}
            </motion.button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              style={{ width: 72, height: 72, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 20px rgba(22,163,74,0.2)' }}>
              <FiCheckCircle size={32} style={{ color: '#16a34a' }} />
            </motion.div>

            <div style={{ background: '#f9fafb', borderRadius: 14, padding: '16px 20px', marginBottom: 20, textAlign: 'left' }}>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                ✉️ A reset link was sent to <strong>{email}</strong>
              </p>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                Didn't receive it? Check your spam folder.
              </p>
            </div>

            <button type="button" onClick={handleResend} disabled={resendCd > 0}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1.5px solid #e5e7eb', cursor: resendCd > 0 ? 'default' : 'pointer', color: resendCd > 0 ? '#9ca3af' : '#093880', fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 10, margin: '0 auto', transition: 'all 0.2s' }}>
              <FiRefreshCw size={14} />
              {resendCd > 0 ? `Resend in ${resendCd}s` : 'Resend email'}
            </button>

            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 16 }}>
              Check your inbox for a reset link from Grihastha.
            </p>
          </div>
        )}
      </div>
    </AuthCard>
  )
}
