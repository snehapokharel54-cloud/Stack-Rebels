import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiArrowRight, FiCalendar, FiMapPin, FiUser, FiCheckCircle, FiClock, FiX } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useAppData } from '../context/AppDataContext'
import { useToast } from '../context/ToastContext'
import Navbar from '../components/Navbar'

export default function BookingsPage() {
  const { user } = useAuth()
  const { getUserBookings, cancelBooking } = useAppData()
  const { showToast } = useToast()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        setError(null)
        const statusFilter = filter !== 'all' ? filter : undefined
        const res = await getUserBookings(statusFilter)
        if (res.success) {
          setBookings(res.data || res.bookings || [])
        } else {
          setError(res.message || 'Failed to load bookings')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [filter, getUserBookings])

  const handleCancel = async (bookingId) => {
    setCancellingId(bookingId)
    const res = await cancelBooking(bookingId)
    if (res.ok) {
      showToast('Booking cancelled successfully', 'success')
      // Refresh bookings
      const refreshRes = await getUserBookings(filter !== 'all' ? filter : undefined)
      if (refreshRes.success) setBookings(refreshRes.data || refreshRes.bookings || [])
    } else {
      showToast(res.error || 'Failed to cancel booking', 'error')
    }
    setCancellingId(null)
  }

  const getStatusColor = (status) => {
    const s = status?.toLowerCase()
    switch (s) {
      case 'confirmed': return { bg: '#dcfce7', text: '#16a34a', icon: FiCheckCircle }
      case 'pending': return { bg: '#fef3c7', text: '#d97706', icon: FiClock }
      case 'completed': return { bg: '#dbeafe', text: '#0284c7', icon: FiCheckCircle }
      case 'cancelled': return { bg: '#fee2e2', text: '#dc2626', icon: FiX }
      case 'rejected': return { bg: '#fee2e2', text: '#dc2626', icon: FiX }
      default: return { bg: '#f3f4f6', text: '#6b7280', icon: FiClock }
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Open Sans', sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 40, position: 'relative' }}
        >
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#093880', fontSize: 14, fontWeight: 600, textDecoration: 'none', marginBottom: 20 }}>
            <FiArrowRight style={{ transform: 'rotate(180deg)' }} /> Back to Home
          </a>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>
            My Bookings
          </h1>
          <p style={{ fontSize: 15, color: '#6b7280' }}>
            Manage and track all your reservations
          </p>
        </motion.div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Bookings' },
            { id: 'confirmed', label: 'Upcoming' },
            { id: 'pending', label: 'Pending' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map(f => (
            <motion.button
              key={f.id}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '10px 18px',
                borderRadius: 999,
                border: filter === f.id ? 'none' : '1.5px solid #e5e7eb',
                background: filter === f.id ? 'linear-gradient(135deg, #093880, #1a56c4)' : '#fff',
                color: filter === f.id ? '#fff' : '#374151',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Open Sans', sans-serif"
              }}
            >
              {f.label}
            </motion.button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
              padding: '12px 16px', color: '#dc2626', fontSize: 13, marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <FiX size={16} />
            {error}
          </motion.div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
             <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#093880', margin: '0 auto 16px' }}
            />
            <p style={{ color: '#9ca3af', fontSize: 14 }}>Loading your bookings...</p>
          </div>
        )}

        {/* Bookings grid */}
        {!loading && bookings.length > 0 && (
          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
            {bookings.map((booking, idx) => {
              const statusColor = getStatusColor(booking.status)
              const StatusIcon = statusColor.icon
              // Map API fields
              const listingTitle = booking.listing_title || booking.propertyName || 'Property'
              const listingImage = booking.listing_photo || booking.propertyImage || 'https://images.unsplash.com/photo-1570129477492-45927003fa5f?w=400&q=80'
              const location = booking.listing_location || booking.location || ''
              const guestName = booking.guest_name || user?.name || ''
              
              // Format dates nicely
              const formatDate = (dateString) => {
                if (!dateString) return ''
                const d = new Date(dateString)
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              }
              const checkIn = formatDate(booking.check_in || booking.checkIn)
              const checkOut = formatDate(booking.check_out || booking.checkOut)
              
              const nights = booking.nights || 1
              const totalPrice = booking.total_price || booking.total || 0

              return (
                <motion.div
                  key={booking.booking_id || booking.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  whileHover={{ y: -4 }}
                  style={{
                    background: '#fff', borderRadius: 16, overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0',
                    cursor: 'pointer', transition: 'box-shadow 0.3s'
                  }}
                >
                  {/* Image */}
                  <div style={{ position: 'relative', overflow: 'hidden', height: 160 }}>
                    <img src={listingImage} alt={listingTitle}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: statusColor.bg, color: statusColor.text,
                      padding: '6px 12px', borderRadius: 999, fontSize: 12,
                      fontWeight: 700, textTransform: 'capitalize'
                    }}>
                      <StatusIcon size={14} />
                      {booking.status}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8, lineHeight: 1.3 }}>
                      {listingTitle}
                    </h3>
                    {location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 12, marginBottom: 12 }}>
                        <FiMapPin size={14} />
                        {location}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 12, marginBottom: 12 }}>
                      <FiCalendar size={14} />
                      {checkIn} to {checkOut} ({nights} night{nights > 1 ? 's' : ''})
                    </div>

                    {guestName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 12, marginBottom: 16 }}>
                        <FiUser size={14} />
                        {guestName}
                      </div>
                    )}

                    {/* Price and actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Total price</p>
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 18, fontWeight: 800, color: '#093880' }}>
                          NPR {Number(totalPrice).toLocaleString()}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {(booking.status?.toLowerCase() === 'pending' || booking.status?.toLowerCase() === 'confirmed') && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCancel(booking.id) }}
                            disabled={cancellingId === booking.id}
                            style={{
                              padding: '8px 14px', borderRadius: 10, border: '1.5px solid #fecaca',
                              background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700,
                              cursor: 'pointer', opacity: cancellingId === booking.id ? 0.6 : 1,
                            }}
                          >
                            {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.08, x: 4 }}
                          whileTap={{ scale: 0.95 }}
                          style={{
                            width: 40, height: 40, borderRadius: 999, border: 'none',
                            background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', boxShadow: '0 3px 12px rgba(9,56,128,0.2)'
                          }}
                        >
                          <FiArrowRight size={18} />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && bookings.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: 'center', padding: '60px 24px',
              background: '#fff', borderRadius: 20, border: '1px solid #f0f0f0'
            }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                width: 80, height: 80, borderRadius: 20, background: '#f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: 36
              }}
            >
              📭
            </motion.div>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              No bookings yet
            </h3>
            <p style={{ color: '#6b7280', fontSize: 14, maxWidth: 300, margin: '0 auto' }}>
              When you make or receive a booking, it will appear here.
            </p>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #f0f0f0', background: '#fff', padding: '28px 24px', textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 60 }}>
        © 2025 Grihastha · Online Rental System
      </footer>
    </div>
  )
}
