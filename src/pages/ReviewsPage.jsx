import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaStar } from 'react-icons/fa'
import { FiStar, FiMessageSquare } from 'react-icons/fi'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

// ─── Star Rating Input ────────────────────────────────────────────────────────
export function StarRatingInput({ value, onChange, size = 28 }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <motion.button key={star} type="button"
          whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="bg-transparent border-none cursor-pointer p-0.5">
          <FaStar size={size} style={{ color: star <= (hovered || value) ? '#f59e0b' : '#e5e7eb', transition: 'color 0.15s' }} />
        </motion.button>
      ))}
    </div>
  )
}

// ─── Display Stars ────────────────────────────────────────────────────────────
export function StarDisplay({ rating, size = 14 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <FaStar key={star} size={size} style={{ color: star <= Math.round(rating) ? '#f59e0b' : '#e5e7eb' }} />
      ))}
    </div>
  )
}

// ─── Review Card ──────────────────────────────────────────────────────────────
export function ReviewCard({ review, index = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
      className="bg-white rounded-2xl border border-gray-100 p-6 transition-all">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-base flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #093880, #1a56c4)' }}>
          {review.avatar || review.userName?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900">{review.userName}</p>
          <p className="text-xs text-gray-400">{review.date}</p>
        </div>
        <div className="flex-shrink-0">
          <StarDisplay rating={review.rating} />
        </div>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
    </motion.div>
  )
}

// ─── Submit Review Form ───────────────────────────────────────────────────────
export function ReviewForm({ propertyId, onSuccess }) {
  const { user } = useAuth()
  const { canUserReview, submitReview } = useAppData()
  const { showToast } = useToast()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!user) return null

  const { canReview, hasBooking, alreadyReviewed } = canUserReview(propertyId, user.email)

  if (alreadyReviewed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <p className="text-green-700 font-semibold text-sm">✅ You've already reviewed this property. Thank you!</p>
      </div>
    )
  }

  if (!hasBooking) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-3">
        <FiStar size={20} className="text-amber-500 flex-shrink-0" />
        <p className="text-amber-700 font-semibold text-sm">You can review only after booking this property.</p>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) { showToast('Please select a star rating.', 'warning'); return }
    if (!comment.trim()) { showToast('Please write a comment.', 'warning'); return }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 700))
    submitReview({ propertyId, userId: user.email, userName: user.name, avatar: user.avatar, rating, comment })
    showToast('Review submitted! Thank you 🌟', 'success')
    setRating(0); setComment('')
    setSubmitting(false)
    onSuccess?.()
  }

  return (
    <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <FiMessageSquare size={18} className="text-blue-600" />
        <h4 style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-gray-900">Write a Review</h4>
      </div>
      <div className="mb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Your Rating</p>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>
      <div className="mb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Your Comment</p>
        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
          placeholder="Share your experience with this property..."
          className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all" />
      </div>
      <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-70"
        style={{ background: 'linear-gradient(135deg, #093880, #1a56c4)', boxShadow: '0 4px 14px rgba(9,56,128,0.3)' }}>
        {submitting ? <><span className="spinner" />Submitting...</> : <><FaStar size={14} />Submit Review</>}
      </motion.button>
    </motion.form>
  )
}

// ─── Reviews Page (standalone) ────────────────────────────────────────────────
import Navbar from '../components/Navbar'
import { useParams } from 'react-router-dom'

export default function ReviewsPage() {
  const { id } = useParams()
  const { getPropertyReviews, getPropertyAverageRating, allProperties } = useAppData()

  const propId = id ? (isNaN(id) ? id : Number(id)) : null
  const property = propId ? allProperties.find(p => String(p.id) === String(propId)) : null
  const reviews = propId ? getPropertyReviews(propId) : []
  const avgRating = propId ? getPropertyAverageRating(propId) : null

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Open Sans, sans-serif' }}>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-10">
        {property && (
          <div className="mb-8">
            <h1 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-3xl font-black text-gray-900 mb-1">Reviews</h1>
            <p className="text-gray-500 text-sm mb-4">{property.title} · {property.location}</p>
            {avgRating && (
              <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm inline-flex">
                <span className="text-4xl font-black text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{avgRating}</span>
                <div>
                  <StarDisplay rating={Number(avgRating)} size={18} />
                  <p className="text-xs text-gray-400 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {!property && (
          <div className="mb-8">
            <h1 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-3xl font-black text-gray-900 mb-2">All Reviews</h1>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <FiStar size={44} className="text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-400 text-lg">No reviews yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to review this property!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mb-8">
            {reviews.map((r, i) => <ReviewCard key={r.id} review={r} index={i} />)}
          </div>
        )}

        {propId && (
          <ReviewForm propertyId={propId} onSuccess={() => {}} />
        )}
      </main>
    </div>
  )
}
