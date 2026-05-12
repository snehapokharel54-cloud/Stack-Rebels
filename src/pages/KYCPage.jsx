import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUpload, FiCheck, FiX, FiClock, FiShield, FiTrash2, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

// ── Upload Zone ────────────────────────────────────────────────────────────────
function UploadZone({ label, hint, file, onFile, onRemove, preview, required }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]; if (f) onFile(f)
  }, [onFile])

  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </p>
      {file ? (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          style={{ borderRadius: 14, border: '2px solid #10b981', background: '#f0fdf4', padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
          {preview
            ? <img src={preview} alt="" style={{ width: 72, height: 54, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid #d1fae5' }} />
            : <div style={{ width: 52, height: 52, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FiCheck size={20} style={{ color: '#10b981' }} /></div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
            <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{(file.size / 1024).toFixed(1)} KB · Ready to submit</p>
          </div>
          <button onClick={onRemove}
            style={{ width: 30, height: 30, borderRadius: '50%', background: '#fee2e2', border: '1px solid #fecaca', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FiTrash2 size={13} style={{ color: '#ef4444' }} />
          </button>
        </motion.div>
      ) : (
        <motion.label
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          whileHover={{ borderColor: '#093880', background: '#eff6ff' }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            borderRadius: 14, border: `2px dashed ${dragging ? '#093880' : '#d1d5db'}`,
            background: dragging ? '#eff6ff' : '#fafafa',
            padding: '28px 16px', cursor: 'pointer', transition: 'all .2s', gap: 10,
          }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: dragging ? '#dbeafe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiUpload size={20} style={{ color: dragging ? '#093880' : '#9ca3af' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>
              Drag & drop or <span style={{ color: '#093880' }}>click to upload</span>
            </p>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>{hint}</p>
          </div>
          <input ref={inputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
            onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]) }} />
        </motion.label>
      )}
    </div>
  )
}

// ── Status Banner ──────────────────────────────────────────────────────────────
function StatusBanner({ status, rejectionReason }) {
  const configs = {
    not_submitted: {
      icon: FiShield, iconColor: '#6b7280', bg: '#f9fafb', border: '#e5e7eb',
      title: 'Identity Not Verified',
      desc: 'Upload your National ID card to verify your identity and start listing properties.',
      badge: null,
    },
    pending: {
      icon: FiClock, iconColor: '#d97706', bg: '#fffbeb', border: '#fde68a',
      title: 'Under Review',
      desc: 'Your National ID has been submitted and is being reviewed by our team. Usually takes 1–2 business days.',
      badge: { label: 'Pending Review', color: '#d97706', bg: '#fef3c7' },
    },
    verified: {
      icon: FiCheckCircle, iconColor: '#10b981', bg: '#f0fdf4', border: '#86efac',
      title: 'Identity Verified',
      desc: 'Your National ID has been approved. You can now list properties on Grihastha.',
      badge: { label: 'Verified ✓', color: '#059669', bg: '#dcfce7' },
    },
    rejected: {
      icon: FiX, iconColor: '#ef4444', bg: '#fef2f2', border: '#fecaca',
      title: 'Verification Rejected',
      desc: rejectionReason || 'Your documents were not accepted. Please resubmit clear images of your National ID.',
      badge: { label: 'Rejected', color: '#dc2626', bg: '#fee2e2' },
    },
  }
  const cfg = configs[status] || configs.not_submitted
  const Icon = cfg.icon

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: 18, padding: '20px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: '#fff', border: `1.5px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={24} style={{ color: cfg.iconColor }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h3 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 15, color: '#0f172a', margin: 0 }}>{cfg.title}</h3>
          {cfg.badge && (
            <span style={{ fontSize: 11, fontWeight: 700, color: cfg.badge.color, background: cfg.badge.bg, padding: '2px 10px', borderRadius: 999 }}>
              {cfg.badge.label}
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.55 }}>{cfg.desc}</p>
      </div>
    </motion.div>
  )
}

// ── Main KYC Page ──────────────────────────────────────────────────────────────
export default function KYCPage({ onBack }) {
  const { user } = useAuth()
  const { getUserKYC, submitKYC } = useAppData()
  const { showToast } = useToast()

  const kycData = getUserKYC?.(user?.email) || { status: 'not_submitted' }
  const currentStatus = kycData.status

  const [files, setFiles] = useState({ front: null, back: null })
  const [previews, setPreviews] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleFile = (key) => (file) => {
    setFiles(f => ({ ...f, [key]: file }))
    if (file.type.startsWith('image/')) {
      const r = new FileReader()
      r.onload = e => setPreviews(p => ({ ...p, [key]: e.target.result }))
      r.readAsDataURL(file)
    }
  }
  const removeFile = (key) => () => {
    setFiles(f => ({ ...f, [key]: null }))
    setPreviews(p => { const n = { ...p }; delete n[key]; return n })
  }

  const canSubmit = files.front && files.back
  const displayStatus = submitted ? 'pending' : currentStatus

  const handleSubmit = async () => {
    if (!canSubmit) { showToast('Please upload both sides of your National ID.', 'warning'); return }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1000))
    submitKYC?.({
      email: user?.email,
      idFrontName: files.front.name,
      idBackName: files.back.name,
    })
    setSubmitting(false)
    setSubmitted(true)
    showToast("National ID submitted! We'll review it within 1\u20132 days.", 'success')
  }

  const isLocked = currentStatus === 'pending' || currentStatus === 'verified' || submitted
  const isVerified = currentStatus === 'verified'

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 24, color: '#0f172a', marginBottom: 4 }}>
          KYC Verification
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
          Upload your National ID card to verify your identity. Required before listing properties.
        </p>
      </div>

      {/* Status banner */}
      <StatusBanner status={displayStatus} rejectionReason={kycData.rejectionReason} />

      {/* Steps indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
        {[
          { n: 1, label: 'Upload ID' },
          { n: 2, label: 'Under Review' },
          { n: 3, label: 'Verified' },
        ].map((step, i) => {
          const done = (step.n === 1 && (displayStatus !== 'not_submitted'))
            || (step.n === 2 && displayStatus === 'verified')
            || (step.n === 3 && displayStatus === 'verified')
          const active = (step.n === 1 && displayStatus === 'not_submitted')
            || (step.n === 2 && displayStatus === 'pending')
            || (step.n === 3 && displayStatus === 'verified')
          return (
            <div key={step.n} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: done || active ? (active ? 'linear-gradient(135deg,#093880,#1a56c4)' : '#10b981') : '#f1f5f9',
                  border: `2px solid ${done ? '#10b981' : active ? '#093880' : '#e5e7eb'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: done || active ? '#fff' : '#9ca3af',
                  fontSize: 13, fontWeight: 700,
                }}>
                  {done && !active ? <FiCheck size={14} /> : step.n}
                </div>
                <p style={{ fontSize: 10, fontWeight: 600, color: active ? '#093880' : done ? '#10b981' : '#9ca3af', whiteSpace: 'nowrap' }}>{step.label}</p>
              </div>
              {i < 2 && <div style={{ flex: 1, height: 2, background: done ? '#10b981' : '#e5e7eb', margin: '0 6px', marginBottom: 18 }} />}
            </div>
          )
        })}
      </div>

      {/* Upload form */}
      <AnimatePresence>
        {!isVerified && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #f0f4ff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', padding: '28px', marginBottom: 20 }}>

            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiShield size={20} style={{ color: '#093880' }} />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 15, color: '#0f172a', margin: 0 }}>National ID Card</h3>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Citizenship certificate or passport — both sides required</p>
              </div>
            </div>

            {/* Upload zones */}
            {isLocked ? (
              <div style={{ background: '#f8fafc', borderRadius: 14, border: '1.5px solid #e2e8f0', padding: '20px', textAlign: 'center' }}>
                <FiClock size={28} style={{ color: '#cbd5e1', marginBottom: 8 }} />
                <p style={{ fontWeight: 600, fontSize: 14, color: '#94a3b8', margin: 0 }}>
                  {currentStatus === 'pending' || submitted ? 'Documents submitted — awaiting admin review.' : ''}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <UploadZone
                  label="Front Side" hint="All 4 corners clearly visible · JPG, PNG or PDF" required
                  file={files.front} onFile={handleFile('front')} onRemove={removeFile('front')} preview={previews.front}
                />
                <UploadZone
                  label="Back Side" hint="Include any barcode or signature" required
                  file={files.back} onFile={handleFile('back')} onRemove={removeFile('back')} preview={previews.back}
                />
              </div>
            )}

            {/* Tips */}
            {!isLocked && (
              <div style={{ marginTop: 20, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 8 }}>
                <FiAlertCircle size={14} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: '#92400e', margin: 0, lineHeight: 1.5 }}>
                  Ensure the ID is <strong>not blurry, cropped or expired</strong>. Both sides must be submitted together.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verified state */}
      {isVerified && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 20, padding: '28px', textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FiCheckCircle size={30} style={{ color: '#10b981' }} />
          </div>
          <h3 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 18, color: '#065f46', marginBottom: 8 }}>
            You're Verified!
          </h3>
          <p style={{ fontSize: 14, color: '#059669', margin: 0 }}>
            Your National ID has been verified. You can now list properties on Grihastha.
          </p>
        </motion.div>
      )}

      {/* Submit button */}
      {!isLocked && !isVerified && (
        <motion.button
          whileHover={canSubmit ? { scale: 1.02, y: -1 } : {}}
          whileTap={canSubmit ? { scale: 0.98 } : {}}
          onClick={handleSubmit}
          disabled={submitting || !canSubmit}
          style={{
            width: '100%', padding: '15px', borderRadius: 14, border: 'none',
            background: canSubmit ? 'linear-gradient(135deg,#093880,#1a56c4)' : '#e5e7eb',
            color: canSubmit ? '#fff' : '#9ca3af',
            fontSize: 15, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed',
            fontFamily: "'Poppins',sans-serif",
            boxShadow: canSubmit ? '0 4px 20px rgba(9,56,128,0.3)' : 'none',
            transition: 'all .2s', opacity: submitting ? 0.8 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          {submitting
            ? <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Submitting...</>
            : <><FiShield size={16} /> Submit for Verification</>}
        </motion.button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
