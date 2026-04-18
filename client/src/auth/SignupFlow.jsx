/**
 * auth/SignupFlow.jsx — Multi-step signup (4 steps for users, 5 for vendors)
 *
 * Step 0 – Basic Info        (name, email, password + strength)
 * Step 1 – Phone + OTP
 * Step 2 – Identity Upload   (citizenship / national ID)
 * Step 3 – Property Verify   (VENDOR ONLY)
 * done   – Success screen
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FiUser, FiMail, FiPhone, FiArrowLeft, FiArrowRight,
  FiCheck, FiShield, FiHome,
} from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import AuthCard from './AuthCard'
import AuthHeader from './AuthHeader'
import { AuthInput, PasswordInput } from './AuthInput'
import OtpInput from './OtpInput'
import FileUpload from './FileUpload'

// ─── Slide animation ───────────────────────────────────
const slide = {
  enter: d => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: d => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
}

// ─── Reusable atoms ────────────────────────────────────
function PrimaryBtn({ children, onClick, type = 'button', loading, disabled }) {
  return (
    <motion.button type={type} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      onClick={onClick} disabled={loading || disabled}
      style={{
        width: '100%', padding: '14px', borderRadius: 14, border: 'none',
        background: 'linear-gradient(135deg, #093880, #1a56c4)',
        color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(9,56,128,0.28)', fontFamily: "'Poppins', sans-serif",
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: loading || disabled ? 0.75 : 1,
      }}>
      {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : children}
    </motion.button>
  )
}

function BackBtn({ onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 20 }}
      onMouseEnter={e => e.currentTarget.style.color = '#111827'}
      onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
      <FiArrowLeft size={15} /> Back
    </button>
  )
}

// ─── Password strength bar ────────────────────────────
function StrengthBar({ password }) {
  if (!password) return null
  const score = password.length >= 12 ? 4 : password.length >= 9 ? 3 : password.length >= 6 ? 2 : 1
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#16a34a']
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(n => (
          <div key={n} style={{ flex: 1, height: 3, borderRadius: 999, background: score >= n ? colors[n] : '#e5e7eb', transition: 'background 0.3s' }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color: colors[score] || '#9ca3af' }}>{labels[score]}</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// STEP 0: Basic Info
// ═══════════════════════════════════════════════════════
function StepBasicInfo({ data, patch, setData, onNext, role, loading: parentLoading }) {
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!data.name.trim()) e.name = 'Full name is required.'
    if (!data.email.includes('@')) e.email = 'Enter a valid email.'
    if (role === 'vendor' && (!data.phone || data.phone.length < 7)) e.phone = 'Phone number is required for Hosts.'
    if (data.password.length < 8) e.password = 'At least 8 characters required.'
    else if (!/[A-Z]/.test(data.password)) e.password = 'Must contain an uppercase letter.'
    else if (!/[0-9]/.test(data.password)) e.password = 'Must contain a number.'
    if (role === 'vendor' && !data.idFile) e.idFile = 'A verification document is required for Hosts.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <AuthInput id="su-name" icon={FiUser} placeholder="Full name" value={data.name}
        onChange={patch('name')} error={errors.name} />
      <AuthInput id="su-email" icon={FiMail} type="email" placeholder="Email address"
        value={data.email} onChange={patch('email')} error={errors.email} />
      <AuthInput id="su-phone" icon={FiPhone} type="tel" placeholder="Phone number (optional for guests)"
        value={data.phone} onChange={patch('phone')} error={errors.phone} />
      <PasswordInput id="su-password" value={data.password} onChange={patch('password')} error={errors.password} />
      <StrengthBar password={data.password} />
      
      {role === 'vendor' && (
        <div style={{ marginTop: 8 }}>
          <FileUpload
            label="Verification Document"
            hint="Citizenship, National ID, or Passport (JPG/PNG/PDF, Max 5MB)"
            accept="image/*,.pdf"
            file={data.idFile}
            onFile={f => setData(d => ({ ...d, idFile: f }))}
          />
          {errors.idFile && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{errors.idFile}</p>}
        </div>
      )}

      <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
        Signing up as: <strong style={{ color: '#374151' }}>{role === 'vendor' ? 'Host' : 'Guest'}</strong>
      </p>
      <PrimaryBtn onClick={() => validate() && onNext()} loading={parentLoading}>
        Continue <FiArrowRight size={15} />
      </PrimaryBtn>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// STEP 1: Phone + OTP
// ═══════════════════════════════════════════════════════
function StepPhone({ data, patch, onNext, onBack, role }) {
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [resendCd, setResendCd] = useState(30)
  const [otpError, setOtpError] = useState('')
  const { verifyEmail } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    const t = setInterval(() => {
      setResendCd(c => {
        if (c <= 1) { clearInterval(t); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const verifyOtp = async () => {
    if (otp.length < 6) { setOtpError('Enter the 6-digit OTP.'); return }
    setVerifying(true)
    // Call real backend email verification
    const result = await verifyEmail({ email: data.email, otp, role })
    setVerifying(false)
    if (!result.ok) { setOtpError(result.error || 'Incorrect OTP.'); return }
    setOtpError('')
    patch('phoneVerified')({ target: { value: true } })
    onNext()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BackBtn onClick={onBack} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <FiMail size={22} style={{ color: '#093880' }} />
        </div>
        <p style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>OTP sent to {data.email}</p>
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Enter the 6-digit code below</p>
      </div>
      <OtpInput value={otp} onChange={setOtp} />
      {otpError && <p style={{ fontSize: 12, color: '#dc2626', textAlign: 'center' }}>{otpError}</p>}
      <PrimaryBtn onClick={verifyOtp} loading={verifying}>Verify & Continue</PrimaryBtn>
      <button type="button" onClick={resendCd > 0 ? undefined : () => showToast('Check your spam folder!', 'info')}
        style={{ background: 'none', border: 'none', cursor: resendCd > 0 ? 'default' : 'pointer', fontSize: 13, color: resendCd > 0 ? '#9ca3af' : '#093880', fontWeight: 600, textAlign: 'center' }}>
        {resendCd > 0 ? `Resend OTP in ${resendCd}s` : 'Resend OTP'}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// STEP 2: Identity Verification
// ═══════════════════════════════════════════════════════
function StepIdentity({ data, setData, onNext, onBack }) {
  const [error, setError] = useState('')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BackBtn onClick={onBack} />
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#92400e' }}>
        <strong>Why this is needed?</strong> Identity verification helps us keep our community safe and trustworthy for everyone.
      </div>
      <FileUpload
        label="Citizenship / National ID"
        hint="JPG, PNG, or PDF · Front side · Max 5MB"
        accept="image/*,.pdf"
        file={data.idFile}
        onFile={f => setData(d => ({ ...d, idFile: f, idVerified: !!f }))}
        tooltip="We use this only to verify your identity. It is never shared publicly."
      />
      {error && <p style={{ fontSize: 12, color: '#dc2626' }}>{error}</p>}
      <PrimaryBtn onClick={onNext}>
        Continue <FiArrowRight size={15} />
      </PrimaryBtn>
      <button type="button" onClick={onNext}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6b7280', textDecoration: 'underline', textAlign: 'center' }}>
        Skip for now
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// STEP 3 (VENDOR ONLY): Property Ownership Verification
// ═══════════════════════════════════════════════════════
function StepPropertyVerify({ data, setData, onNext, onBack }) {
  const [errors, setErrors] = useState({})
  const patch = k => e => setData(d => ({ ...d, [k]: e.target.value }))

  const inp = {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', fontFamily: "'Open Sans', sans-serif",
    background: '#fafafa',
  }

  const validate = () => {
    const e = {}
    if (!data.propName?.trim()) e.propName = 'Property name is required.'
    if (!data.propLocation?.trim()) e.propLocation = 'Location is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BackBtn onClick={onBack} />
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <FiHome size={15} style={{ color: '#2563eb' }} />
          <strong style={{ fontSize: 13, color: '#1d4ed8' }}>Verify your property ownership</strong>
        </div>
        <p style={{ fontSize: 12, color: '#3b82f6' }}>
          Upload documents to build trust with guests and unlock full host features.
        </p>
      </div>

      {[
        { key: 'propName', label: 'Property Name *', placeholder: 'e.g. Sunrise Villa, Nagarkot' },
        { key: 'propLocation', label: 'Property Location *', placeholder: 'e.g. Thamel, Kathmandu' },
      ].map(({ key, label, placeholder }) => (
        <div key={key}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>{label}</label>
          <input placeholder={placeholder} value={data[key] || ''} onChange={patch(key)}
            style={{ ...inp, borderColor: errors[key] ? '#fca5a5' : '#e5e7eb' }}
            onFocus={e => e.target.style.borderColor = '#093880'}
            onBlur={e => e.target.style.borderColor = errors[key] ? '#fca5a5' : '#e5e7eb'} />
          {errors[key] && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{errors[key]}</p>}
        </div>
      ))}

      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Description (Optional)</label>
        <textarea placeholder="Describe your property briefly..." rows={3} value={data.propDesc || ''} onChange={patch('propDesc')}
          style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
          onFocus={e => e.target.style.borderColor = '#093880'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
      </div>

      <FileUpload
        label="Ownership Document"
        hint="Title deed or land ownership certificate · Max 5MB"
        accept="image/*,.pdf"
        file={data.propDoc}
        onFile={f => setData(d => ({ ...d, propDoc: f }))}
        tooltip="This helps verify you are the rightful owner of the property."
      />

      <PrimaryBtn onClick={() => validate() && onNext()}>
        Continue <FiArrowRight size={15} />
      </PrimaryBtn>
      <button type="button" onClick={onNext}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6b7280', textDecoration: 'underline', textAlign: 'center' }}>
        Skip — add later in dashboard
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// SUCCESS SCREEN
// ═══════════════════════════════════════════════════════
function StepSuccess({ role, name, onLoginClick }) {
  const navigate = useNavigate()
  const isHost = role === 'vendor'
  const badges = isHost
    ? ['Host Account Created', 'Identity Submitted', 'Ready to List Properties']
    : ['Verified Guest Account', 'Identity Submitted', 'Ready to Book Stays']

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
      <div style={{ textAlign: 'center', padding: '4px 0 8px' }}>
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
          style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 32px rgba(22,163,74,0.3)' }}>
          <FiCheck size={36} style={{ color: '#fff' }} />
        </motion.div>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
          You're all set{name ? `, ${name.split(' ')[0]}` : ''}!
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>
          {isHost ? 'Log in to access your host dashboard and start listing.' : 'Log in to explore amazing stays across Nepal.'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {badges.map(b => (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f0fdf4', borderRadius: 10, padding: '10px 14px', textAlign: 'left' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FiCheck size={12} style={{ color: '#fff' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>{b}</span>
            </div>
          ))}
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={onLoginClick || (() => navigate('/auth?mode=login'))}
          style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(9,56,128,0.28)', fontFamily: "'Poppins', sans-serif" }}>
          Go to Login
        </motion.button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
          <FiShield size={13} style={{ color: '#16a34a' }} />
          <span style={{ fontSize: 11, color: '#6b7280' }}>Your data is <strong>encrypted & secure</strong></span>
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════
export default function SignupFlow({ role = 'user', onSwitchToLogin }) {
  const isVendor = role === 'vendor'
  const TOTAL_STEPS = isVendor ? 3 : 2
  const { signup } = useAuth()
  const { showToast } = useToast()

  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [data, setData] = useState({
    name: '', email: '', password: '',
    phone: '', phoneVerified: false,
    idFile: null, idVerified: false,
    propName: '', propLocation: '', propDesc: '', propDoc: null,
  })

  const patch = k => e => setData(d => ({ ...d, [k]: typeof e.target?.value !== 'undefined' ? e.target.value : e.target.value }))

  const go = (n) => { setDir(n > step ? 1 : -1); setStep(n) }

  // After basic info → register with backend, then continue to email verification
  const handleSignup = async () => {
    setSubmitting(true)
    const result = await signup({
      full_name: data.name, email: data.email, password: data.password, role,
      phone: data.phone, document: data.idFile
    })
    setSubmitting(false)
    if (!result.ok) { showToast(result.error, 'error'); return }
    if (result.needsVerification) {
      showToast('Account created! Check your email for the verification OTP.', 'success')
    }
    // Move to phone/OTP step which now handles email verification
    go(1)
  }

  const HEADERS = [
    { title: 'Create your account', sub: 'Enter your basic information to get started.' },
    { title: 'Verify your email', sub: "We'll send an OTP to confirm your email." },
    ...(isVendor ? [{ title: 'Property ownership', sub: 'Required to list and manage properties.' }] : []),
  ]
  const h = HEADERS[step] || HEADERS[HEADERS.length - 1]

  const footer = (
    <div style={{ padding: '0 36px 24px', textAlign: 'center' }}>
      <p style={{ fontSize: 12, color: '#9ca3af' }}>
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#093880', fontWeight: 700, fontSize: 12, textDecoration: 'underline' }}>
          Log In
        </button>
      </p>
      <p style={{ fontSize: 11, color: '#d1d5db', marginTop: 6 }}>
        By continuing you agree to our{' '}
        <span style={{ color: '#093880', cursor: 'pointer' }}>Terms</span> &{' '}
        <span style={{ color: '#093880', cursor: 'pointer' }}>Privacy Policy</span>
      </p>
    </div>
  )

  if (done) {
    return (
      <AuthCard maxWidth={460}>
        <div style={{ padding: '28px 36px 24px', background: 'linear-gradient(135deg, #093880, #1a56c4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/grihastha-logo.svg" alt="" style={{ width: 32, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 17, fontFamily: "'Poppins', sans-serif" }}>Grihastha</span>
          </div>
        </div>
        <div style={{ padding: '32px 36px' }}>
          <StepSuccess role={role} name={data.name} onLoginClick={onSwitchToLogin} />
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard maxWidth={460}>
      <AuthHeader title={h.title} subtitle={h.sub} step={step} totalSteps={TOTAL_STEPS} />

      <div style={{ padding: '28px 36px 24px', minHeight: 320, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={`step-${step}`} custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}>
            {step === 0 && (
              <StepBasicInfo data={data} patch={patch} setData={setData} onNext={handleSignup} role={role} loading={submitting} />
            )}
            {step === 1 && (
              <StepPhone data={data} patch={patch} onNext={() => { if (isVendor) go(2); else setDone(true) }} onBack={() => go(0)} role={role} />
            )}
            {step === 2 && isVendor && (
              <StepPropertyVerify data={data} setData={setData} onNext={() => setDone(true)} onBack={() => go(1)} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Submitting overlay */}
        {submitting && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <span className="spinner-dark" style={{ width: 36, height: 36 }} />
              <p style={{ fontSize: 13, color: '#374151', marginTop: 12 }}>Creating your account…</p>
            </div>
          </div>
        )}
      </div>

      {footer}
    </AuthCard>
  )
}
