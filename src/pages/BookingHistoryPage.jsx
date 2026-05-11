import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FiArrowLeft, FiCalendar, FiMapPin, FiUsers, FiX,
  FiStar, FiEye, FiCheck, FiClock, FiXCircle,
} from 'react-icons/fi'
import { FaStar } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ReviewModal } from './ReviewsPage'

// ─── Tabs config ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'upcoming', label: 'Upcoming', icon: FiClock },
  { id: 'completed', label: 'Completed', icon: FiCheck },
  { id: 'cancelled', label: 'Cancelled', icon: FiXCircle },
]

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, checkOut }) {
  const now = new Date()
  const isPast = new Date(checkOut) < now
  const s = status === 'cancelled' ? 'cancelled' : isPast ? 'completed' : 'confirmed'
  const cfg = {
    confirmed: { bg: '#ecfdf5', color: '#16a34a', border: '#86efac', label: 'Confirmed', dot: '#22c55e' },
    completed: { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb', label: 'Completed', dot: '#6b7280' },
    cancelled: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Cancelled', dot: '#ef4444' },
  }
  const st = cfg[s]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
      {st.label}
    </span>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({ tab, navigate }) {
  const msgs = {
    upcoming:  { icon: FiClock,    title: 'No upcoming trips', sub: 'Your future adventures will appear here.', cta: 'Explore Properties', action: () => navigate('/home') },
    completed: { icon: FiCheck,    title: 'No completed stays yet', sub: 'Your past trips and stays will show up here.' },
    cancelled: { icon: FiXCircle,  title: 'No cancelled bookings', sub: 'Great — nothing cancelled so far!' },
  }
  const m = msgs[tab]
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f0f0f0', padding: '72px 32px', textAlign: 'center', boxShadow: '0 2px 20px rgba(0,0,0,0.04)' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <m.icon size={30} style={{ color: '#9ca3af' }} />
      </div>
      <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 18, color: '#111827', marginBottom: 8 }}>{m.title}</h3>
      <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: m.cta ? 24 : 0 }}>{m.sub}</p>
      {m.cta && (
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={m.action}
          style={{ padding: '12px 28px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: "'Poppins', sans-serif", boxShadow: '0 4px 16px rgba(9,56,128,0.3)' }}>
          {m.cta}
        </motion.button>
      )}
    </motion.div>
  )
}

// ─── Booking Card ─────────────────────────────────────────────────────────────
function BookingCard({ booking, now, onCancel, onReview, hasReviewed }) {
  const navigate = useNavigate()
  const isPast = new Date(booking.checkOut) < now
  const isUpcoming = !isPast && booking.status !== 'cancelled'
  const canCancel = booking.status === 'confirmed' && new Date(booking.checkIn) > now

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: '0 16px 48px rgba(0,0,0,0.09)' }}
      style={{
        background: '#fff', borderRadius: 24, border: '1.5px solid #f0f0f0',
        overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.25s',
      }}>
      {/* Top image strip */}
      <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
        <img src={booking.propertyImage} alt={booking.propertyTitle}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55))' }} />
        {/* Status badge on image */}
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <StatusBadge status={booking.status} checkOut={booking.checkOut} />
        </div>
        {/* Booking ID on image */}
        <p style={{ position: 'absolute', bottom: 10, left: 14, fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
          #{booking.id}
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 22px' }}>
        <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>
          {booking.propertyTitle}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontSize: 12, marginBottom: 16 }}>
          <FiMapPin size={11} style={{ flexShrink: 0 }} />
          <span>{booking.propertyLocation}</span>
        </div>

        {/* Dates + guests row */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#f8fafc', borderRadius: 10, padding: '8px 12px' }}>
            <FiCalendar size={13} style={{ color: '#093880' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{booking.checkIn}</span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>→</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{booking.checkOut}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#f8fafc', borderRadius: 10, padding: '8px 12px' }}>
            <FiUsers size={13} style={{ color: '#093880' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{booking.guests} guest{booking.guests > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Price + CTA row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 18, color: '#093880' }}>
              NPR {booking.totalPrice?.toLocaleString()}
            </span>
            <span style={{ fontSize: 12, color: '#9ca3af' }}> total</span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* View property */}
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate(`/property/${booking.propertyId}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>
              <FiEye size={13} /> View
            </motion.button>

            {/* Cancel */}
            {canCancel && (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => onCancel(booking)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 12, border: '1.5px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#dc2626' }}>
                <FiX size={13} /> Cancel
              </motion.button>
            )}

            {/* Write Review — only for completed, not cancelled, not already reviewed */}
            {isPast && booking.status !== 'cancelled' && !hasReviewed && (
              <motion.button whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }}
                onClick={() => onReview(booking)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
                  borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#fff',
                  boxShadow: '0 3px 12px rgba(245,158,11,0.35)',
                }}>
                <FiStar size={13} /> Write Review
              </motion.button>
            )}

            {/* Already reviewed badge */}
            {isPast && booking.status !== 'cancelled' && hasReviewed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderRadius: 12, background: '#ecfdf5', border: '1px solid #86efac' }}>
                <FiCheck size={13} style={{ color: '#16a34a' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>Reviewed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BookingHistoryPage() {
  const { getUserBookings, cancelBooking, hasUserReviewedProperty } = useAppData()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [cancelling, setCancelling] = useState(null)
  const [reviewing, setReviewing] = useState(null)   // { propertyId, propertyTitle }

  const allBookings = getUserBookings(user?.email)
  const now = new Date()

  const upcoming  = allBookings.filter(b => b.status !== 'cancelled' && new Date(b.checkOut) >= now)
  const completed = allBookings.filter(b => b.status !== 'cancelled' && new Date(b.checkOut) < now)
  const cancelled = allBookings.filter(b => b.status === 'cancelled')

  const countMap    = { upcoming: upcoming.length, completed: completed.length, cancelled: cancelled.length }
  const displayedMap = { upcoming, completed, cancelled }
  const displayed   = displayedMap[activeTab] || []

  const handleCancel = (booking) => {
    cancelBooking(booking.id)
    setCancelling(null)
    showToast('Booking cancelled successfully.', 'warning')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Open Sans', sans-serif" }}>
      <Navbar />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
          <button onClick={() => navigate(-1)}
            style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <FiArrowLeft size={17} />
          </button>
          <div>
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0 }}>My Bookings</h1>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 3 }}>{allBookings.length} total booking{allBookings.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#fff', borderRadius: 18, padding: 6, marginBottom: 32, width: 'fit-content', gap: 4, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1.5px solid #f0f0f0' }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id
            return (
              <motion.button key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={!active ? { scale: 1.03 } : {}}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '10px 20px', borderRadius: 13, border: 'none', fontSize: 13,
                  fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: "'Poppins', sans-serif",
                  background: active ? 'linear-gradient(135deg, #093880, #1a56c4)' : 'transparent',
                  color: active ? '#fff' : '#6b7280',
                  boxShadow: active ? '0 4px 14px rgba(9,56,128,0.3)' : 'none',
                }}>
                <tab.icon size={14} />
                {tab.label}
                {countMap[tab.id] > 0 && (
                  <span style={{
                    background: active ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                    color: active ? '#fff' : '#6b7280',
                    fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 999,
                  }}>
                    {countMap[tab.id]}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Completed tab tip */}
        {activeTab === 'completed' && completed.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'linear-gradient(135deg, #fffbeb, #fef9c3)', border: '1.5px solid #fde68a', borderRadius: 16, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <FaStar size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>
              You can leave a review on any completed stay. Click <strong>"Write Review"</strong> on a booking below!
            </p>
          </motion.div>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            {displayed.length === 0 ? (
              <EmptyState tab={activeTab} navigate={navigate} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
                {displayed.map((booking, i) => (
                  <motion.div key={booking.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <BookingCard
                      booking={booking}
                      now={now}
                      onCancel={(b) => setCancelling(b)}
                      onReview={(b) => setReviewing({ propertyId: b.propertyId, propertyTitle: b.propertyTitle })}
                      hasReviewed={hasUserReviewedProperty(booking.propertyId, user?.email)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Cancel confirmation modal */}
      <AnimatePresence>
        {cancelling && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(4px)' }}
            onClick={() => setCancelling(null)}>
            <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 28, padding: '36px 32px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <FiX size={26} style={{ color: '#dc2626' }} />
              </div>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 20, color: '#0f172a', marginBottom: 8 }}>Cancel Booking?</h3>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 4 }}>{cancelling?.propertyTitle}</p>
              <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 28 }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setCancelling(null)}
                  style={{ flex: 1, padding: '13px', borderRadius: 14, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                  Keep Booking
                </button>
                <button onClick={() => handleCancel(cancelling)}
                  style={{ flex: 1, padding: '13px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                  Yes, Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review modal */}
      <AnimatePresence>
        {reviewing && (
          <ReviewModal
            propertyId={reviewing.propertyId}
            propertyTitle={reviewing.propertyTitle}
            onClose={() => setReviewing(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
