import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiCalendar, FiMapPin, FiUsers, FiX } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const TABS = [
  { id: 'upcoming',  label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

function StatusBadge({ status, checkOut }) {
  const now = new Date()
  const isPast = new Date(checkOut) < now
  const s = status === 'cancelled' ? 'cancelled' : isPast ? 'completed' : 'confirmed'
  const cfg = {
    confirmed:  { bg: '#ecfdf5', color: '#16a34a', label: 'Confirmed' },
    completed:  { bg: '#f3f4f6', color: '#374151', label: 'Completed' },
    cancelled:  { bg: '#fef2f2', color: '#dc2626', label: 'Cancelled' },
  }
  const st = cfg[s]
  return (
    <span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>
      {st.label}
    </span>
  )
}

export default function BookingHistoryPage() {
  const { getUserBookings, cancelBooking } = useAppData()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [cancelling, setCancelling] = useState(null)

  const allBookings = getUserBookings(user?.email)
  const now = new Date()

  const upcoming  = allBookings.filter(b => b.status !== 'cancelled' && new Date(b.checkOut) >= now)
  const completed = allBookings.filter(b => b.status !== 'cancelled' && new Date(b.checkOut) < now)
  const cancelled = allBookings.filter(b => b.status === 'cancelled')

  const countMap = { upcoming: upcoming.length, completed: completed.length, cancelled: cancelled.length }
  const displayedMap = { upcoming, completed, cancelled }
  const displayed = displayedMap[activeTab] || []

  const handleCancel = (booking) => {
    cancelBooking(booking.id)
    setCancelling(null)
    showToast('Booking cancelled successfully.', 'warning')
  }

  const EMPTY_MSGS = {
    upcoming:  { title: 'No upcoming bookings', sub: 'Start planning your next adventure!' },
    completed: { title: 'No completed stays yet', sub: 'Your past trips will appear here.' },
    cancelled: { title: 'No cancelled bookings', sub: 'Great — nothing was cancelled!' },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Open Sans', sans-serif" }}>
      <Navbar />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>
            <FiArrowLeft size={17} />
          </button>
          <div>
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 26, fontWeight: 900, color: '#0f172a', margin: 0 }}>My Bookings</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{allBookings.length} total booking{allBookings.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 14, padding: 4, marginBottom: 28, width: 'fit-content', gap: 2 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px', borderRadius: 11, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Poppins', sans-serif",
                background: activeTab === tab.id ? '#fff' : 'transparent',
                color: activeTab === tab.id ? '#093880' : '#6b7280',
                boxShadow: activeTab === tab.id ? '0 1px 8px rgba(0,0,0,0.08)' : 'none',
              }}>
              {tab.label}
              {countMap[tab.id] > 0 && (
                <span style={{ marginLeft: 6, background: activeTab === tab.id ? '#eff6ff' : '#e5e7eb', color: activeTab === tab.id ? '#093880' : '#9ca3af', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 999 }}>
                  {countMap[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {displayed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <FiCalendar size={28} style={{ color: '#9ca3af' }} />
                </div>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 20, color: '#111827', marginBottom: 8 }}>
                  {EMPTY_MSGS[activeTab]?.title}
                </h3>
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
                  {EMPTY_MSGS[activeTab]?.sub}
                </p>
                {activeTab === 'upcoming' && (
                  <button onClick={() => navigate('/home')}
                    style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                    Find a Place
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {displayed.map((booking, i) => (
                  <motion.div key={booking.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #f0f0f0', padding: '20px 24px', display: 'flex', gap: 20, alignItems: 'flex-start', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
                    <img src={booking.propertyImage} alt={booking.propertyTitle}
                      style={{ width: 110, height: 90, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <div>
                          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 4 }}>{booking.propertyTitle}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontSize: 12 }}>
                            <FiMapPin size={11} /> {booking.propertyLocation}
                          </div>
                        </div>
                        <StatusBadge status={booking.status} checkOut={booking.checkOut} />
                      </div>
                      <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151' }}>
                          <FiCalendar size={13} style={{ color: '#093880' }} />
                          <span>{booking.checkIn} → {booking.checkOut}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151' }}>
                          <FiUsers size={13} style={{ color: '#093880' }} />
                          <span>{booking.guests} guest{booking.guests > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 15, color: '#093880' }}>NPR {booking.totalPrice?.toLocaleString()}</span>
                          <span style={{ fontSize: 12, color: '#9ca3af' }}> total</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => navigate(`/property/${booking.propertyId}`)}
                            style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>
                            View Property
                          </button>
                          {booking.status === 'confirmed' && new Date(booking.checkIn) > now && (
                            <button onClick={() => setCancelling(booking)}
                              style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#dc2626' }}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
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
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => setCancelling(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 24, padding: '32px', maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <FiX size={24} style={{ color: '#dc2626' }} />
              </div>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, color: '#0f172a', marginBottom: 8 }}>Cancel Booking?</h3>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 8 }}>{cancelling?.propertyTitle}</p>
              <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 24 }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => setCancelling(null)}
                  style={{ padding: '11px 24px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                  Keep Booking
                </button>
                <button onClick={() => handleCancel(cancelling)}
                  style={{ padding: '11px 24px', borderRadius: 12, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                  Yes, Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
