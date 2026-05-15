import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaStar } from 'react-icons/fa'
import { FiStar, FiMessageSquare, FiCheck, FiArrowLeft, FiX } from 'react-icons/fi'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

// ─── Avatar gradient palette ──────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #093880, #1a56c4)',
  'linear-gradient(135deg, #0891b2, #06b6d4)',
  'linear-gradient(135deg, #059669, #10b981)',
  'linear-gradient(135deg, #dc2626, #f97316)',
  'linear-gradient(135deg, #db2777, #ec4899)',
]
function getAvatarGradient(str = '') {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

// ─── Star Rating Input ────────────────────────────────────────────────────────
export function StarRatingInput({ value, onChange, size = 32 }) {
  const [hovered, setHovered] = useState(0)
  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <motion.button key={star} type="button"
            whileHover={{ scale: 1.25, y: -2 }} whileTap={{ scale: 0.9 }}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
            <FaStar size={size} style={{
              color: star <= (hovered || value) ? '#f59e0b' : '#e5e7eb',
              transition: 'color 0.12s, filter 0.12s',
              filter: star <= (hovered || value) ? 'drop-shadow(0 2px 6px rgba(245,158,11,0.5))' : 'none',
            }} />
          </motion.button>
        ))}
        <AnimatePresence mode="wait">
          {(hovered || value) > 0 && (
            <motion.span key={hovered || value}
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginLeft: 4 }}>
              {labels[hovered || value]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Star Display ─────────────────────────────────────────────────────────────
export function StarDisplay({ rating, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <FaStar key={star} size={size} style={{ color: star <= Math.round(rating) ? '#f59e0b' : '#e5e7eb' }} />
      ))}
    </div>
  )
}

// ─── Rating Distribution Bar ──────────────────────────────────────────────────
function RatingBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', width: 8 }}>{star}</span>
      <FaStar size={11} style={{ color: '#f59e0b', flexShrink: 0 }} />
      <div style={{ flex: 1, height: 8, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, delay: (5 - star) * 0.08, ease: 'easeOut' }}
          style={{ height: '100%', background: pct > 60 ? 'linear-gradient(90deg, #f59e0b, #fcd34d)' : pct > 30 ? 'linear-gradient(90deg, #f59e0b88, #fcd34d88)' : '#e5e7eb', borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 12, color: '#9ca3af', width: 22, textAlign: 'right' }}>{count}</span>
    </div>
  )
}

// ─── Review Card ──────────────────────────────────────────────────────────────
export function ReviewCard({ review, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 120 }}
      whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0,0,0,0.10)' }}
      style={{
        background: '#fff', borderRadius: 20, border: '1.5px solid #f0f0f0',
        padding: '22px 24px', transition: 'box-shadow 0.2s', cursor: 'default'
      }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: getAvatarGradient(review.userName),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 900, fontSize: 16, flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            {review.avatar || review.userName?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 2 }}>{review.userName}</p>
            <p style={{ fontSize: 12, color: '#9ca3af' }}>{review.date}</p>
          </div>
        </div>
        {/* Star rating badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: review.rating >= 4 ? '#fffbeb' : review.rating >= 3 ? '#f9fafb' : '#fef2f2',
          border: `1.5px solid ${review.rating >= 4 ? '#fde68a' : review.rating >= 3 ? '#e5e7eb' : '#fecaca'}`,
          borderRadius: 10, padding: '5px 10px', flexShrink: 0
        }}>
          <FaStar size={12} style={{ color: '#f59e0b' }} />
          <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 13, color: '#111827' }}>{review.rating}.0</span>
        </div>
      </div>
      {/* Comment */}
      <p style={{
        fontSize: 14, color: '#374151', lineHeight: 1.7,
        borderLeft: '3px solid #e5e7eb', paddingLeft: 14,
        margin: 0
      }}>"{review.comment}"</p>
    </motion.div>
  )
}

// ─── Review Form (standalone export) ─────────────────────────────────────────
export function ReviewForm({ propertyId, onSuccess, compact = false }) {
  const { user } = useAuth()
  const { canUserReview, submitReview } = useAppData()
  const { showToast } = useToast()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!user || user.role === 'vendor' || user.role === 'admin') return null

  const { hasBooking, alreadyReviewed } = canUserReview(propertyId, user.id)

  if (alreadyReviewed || submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', border: '1.5px solid #86efac', borderRadius: 20, padding: '24px', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <FiCheck size={24} color="#fff" />
        </div>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#15803d' }}>Review Submitted!</p>
        <p style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>Thank you for sharing your experience 🌟</p>
      </motion.div>
    )
  }

  if (!hasBooking) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #fffbeb, #fef9c3)', border: '1.5px solid #fde68a', borderRadius: 20, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FiStar size={20} style={{ color: '#d97706' }} />
        </div>
        <div>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: '#92400e', marginBottom: 2 }}>Book first to review</p>
          <p style={{ fontSize: 12, color: '#b45309' }}>You need a confirmed booking before you can leave a review.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) { showToast('Please select a star rating.', 'warning'); return }
    if (!comment.trim()) { showToast('Please write a comment.', 'warning'); return }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 800))
    submitReview({ propertyId, userId: user.id, userName: user.name, avatar: user.avatar, rating, comment })
    showToast('Review submitted! Thank you 🌟', 'success')
    setRating(0); setComment(''); setSubmitted(true)
    setSubmitting(false)
    onSuccess?.()
  }

  return (
    <motion.form onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#fff',
        borderRadius: 24,
        border: '1.5px solid #e5e7eb',
        padding: compact ? '24px' : '32px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
      }}>
      {/* Form header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #093880, #1a56c4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FiMessageSquare size={18} color="#fff" />
        </div>
        <div>
          <h4 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 16, color: '#0f172a', margin: 0 }}>Share Your Experience</h4>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Help future guests with your honest review</p>
        </div>
      </div>

      {/* Rating */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Your Rating</p>
        <StarRatingInput value={rating} onChange={setRating} size={30} />
      </div>

      {/* Comment */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Your Review</p>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={4}
          placeholder="What did you love? What could be improved? Help future guests make better decisions..."
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 16,
            border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111827',
            background: '#fafafa', outline: 'none', resize: 'none',
            fontFamily: "'Open Sans', sans-serif", lineHeight: 1.6,
            transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box',
          }}
          onFocus={e => { e.target.style.borderColor = '#093880'; e.target.style.boxShadow = '0 0 0 3px rgba(9,56,128,0.08)' }}
          onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
        />
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, textAlign: 'right' }}>{comment.length}/500 characters</p>
      </div>

      {/* Submit */}
      <motion.button type="submit" disabled={submitting || rating === 0}
        whileHover={!submitting && rating > 0 ? { scale: 1.02, y: -1 } : {}}
        whileTap={!submitting && rating > 0 ? { scale: 0.98 } : {}}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '15px', borderRadius: 16, border: 'none',
          background: rating === 0 ? '#f3f4f6' : 'linear-gradient(135deg, #093880, #1a56c4)',
          color: rating === 0 ? '#9ca3af' : '#fff',
          fontSize: 14, fontWeight: 700, cursor: rating === 0 ? 'not-allowed' : 'pointer',
          fontFamily: "'Poppins', sans-serif",
          boxShadow: rating > 0 ? '0 4px 20px rgba(9,56,128,0.3)' : 'none',
          transition: 'all 0.2s', opacity: submitting ? 0.8 : 1,
        }}>
        {submitting
          ? <><span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Submitting...</>
          : <><FaStar size={14} />Submit Review</>}
      </motion.button>
    </motion.form>
  )
}

// ─── Review Modal (used from booking history) ─────────────────────────────────
export function ReviewModal({ propertyId, propertyTitle, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ scale: 0.92, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 28, padding: '32px', maxWidth: 500, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.25)', position: 'relative' }}>
        {/* Close */}
        <button onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
          <FiX size={16} />
        </button>
        {/* Property name */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Reviewing</p>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, color: '#0f172a' }}>{propertyTitle}</h3>
        </div>
        <ReviewForm propertyId={propertyId} compact onSuccess={onClose} />
      </motion.div>
    </motion.div>
  )
}

// ─── Reviews Page (standalone) ────────────────────────────────────────────────
import Navbar from '../components/Navbar'
import { useParams, useNavigate } from 'react-router-dom'

export default function ReviewsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getPropertyReviews, getPropertyAverageRating, allProperties } = useAppData()
  const { user } = useAuth()

  const propId = id ? (isNaN(id) ? id : Number(id)) : null
  const property = propId ? allProperties.find(p => String(p.id) === String(propId)) : null
  const reviews = propId ? getPropertyReviews(propId) : []
  const avgRating = propId ? getPropertyAverageRating(propId) : null

  const isHostOrAdmin = user?.role === 'vendor' || user?.role === 'admin'

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map(s => ({ star: s, count: reviews.filter(r => r.rating === s).length }))

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Open Sans', sans-serif" }}>
      <Navbar />
      <main style={{ maxWidth: 820, margin: '0 auto', padding: '40px 24px' }}>

        {/* Back button */}
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, fontWeight: 600, marginBottom: 28, padding: 0 }}>
          <FiArrowLeft size={16} /> Back
        </button>

        {property && (
          <>
            {/* Hero header */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a6e 100%)',
              borderRadius: 28, padding: '36px 40px', marginBottom: 32, color: '#fff',
              position: 'relative', overflow: 'hidden'
            }}>
              {/* Decorative circles */}
              <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
              <div style={{ position: 'absolute', bottom: -60, right: 80, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, position: 'relative' }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Reviews</p>
                  <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 'clamp(22px, 4vw, 30px)', margin: 0, marginBottom: 6 }}>{property.title}</h1>
                  <p style={{ fontSize: 14, opacity: 0.65 }}>{property.location}</p>
                </div>

                {avgRating && (
                  <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: 20, padding: '20px 28px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 48, lineHeight: 1, color: '#fff', marginBottom: 6 }}>{avgRating}</p>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                      <StarDisplay rating={Number(avgRating)} size={16} />
                    </div>
                    <p style={{ fontSize: 12, opacity: 0.6 }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                  </div>
                )}
              </div>

              {/* Distribution bars */}
              {reviews.length > 0 && (
                <div style={{ marginTop: 28, maxWidth: 320 }}>
                  {dist.map(({ star, count }) => (
                    <RatingBar key={star} star={star} count={count} total={reviews.length} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!property && (
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 30, color: '#0f172a', marginBottom: 28 }}>All Reviews</h1>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: reviews.length > 0 ? '1fr' : '1fr', gap: 24 }}>
          {/* Reviews list */}
          <div>
            {reviews.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f0f0f0', padding: '64px 32px', textAlign: 'center', boxShadow: '0 2px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <FiStar size={32} style={{ color: '#d1d5db' }} />
                </div>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 18, color: '#374151', marginBottom: 8 }}>No reviews yet</h3>
                <p style={{ fontSize: 14, color: '#9ca3af', maxWidth: 280, margin: '0 auto' }}>Be the first to share your experience and help future guests!</p>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
                {reviews.map((r, i) => <ReviewCard key={r.id} review={r} index={i} />)}
              </div>
            )}
          </div>

          {/* Review form — only for regular users */}
          {propId && !isHostOrAdmin && (
            <ReviewForm propertyId={propId} onSuccess={() => {}} />
          )}

          {/* Host/Admin info banner */}
          {isHostOrAdmin && propId && (
            <div style={{
              background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
              border: '1.5px solid #bfdbfe', borderRadius: 20, padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: 14
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FiStar size={20} color="#fff" />
              </div>
              <div>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: '#1e40af', marginBottom: 2 }}>
                  {user?.role === 'admin' ? 'Admin View' : 'Host View'}
                </p>
                <p style={{ fontSize: 13, color: '#3b82f6' }}>
                  {user?.role === 'admin'
                    ? 'You can delete reviews from the Admin Dashboard → Reviews section.'
                    : 'These are guest reviews for your property. Keep providing great experiences!'}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
