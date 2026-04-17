import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiArrowRight, FiCalendar, FiMapPin, FiUser, FiCheckCircle, FiClock, FiX } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

export default function BookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, upcoming, completed, cancelled
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/bookings', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (!response.ok) throw new Error('Failed to load bookings')
        const data = await response.json()
        setBookings(data.bookings || [])
      } catch (err) {
        setError(err.message)
        // Mock data for demo
        setBookings([
          {
            id: 1,
            propertyName: 'Cozy Mountain Retreat',
            location: 'Nagarkot, Nepal',
            guestName: 'John Doe',
            checkIn: '2025-04-15',
            checkOut: '2025-04-18',
            nights: 3,
            totalPrice: 450,
            status: 'confirmed',
            propertyImage: 'https://images.unsplash.com/photo-1570129477492-45927003fa5f?w=400&q=80'
          },
          {
            id: 2,
            propertyName: 'Lakeside Villa',
            location: 'Pokhara, Nepal',
            guestName: 'Jane Smith',
            checkIn: '2025-05-01',
            checkOut: '2025-05-05',
            nights: 4,
            totalPrice: 600,
            status: 'confirmed',
            propertyImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80'
          },
          {
            id: 3,
            propertyName: 'Historic Kathmandu House',
            location: 'Kathmandu, Nepal',
            guestName: 'Robert Johnson',
            checkIn: '2025-03-20',
            checkOut: '2025-03-22',
            nights: 2,
            totalPrice: 280,
            status: 'completed',
            propertyImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80'
          },
          {
            id: 4,
            propertyName: 'Garden Cottage',
            location: 'Bandipur, Nepal',
            guestName: 'Sarah Wilson',
            checkIn: '2025-04-10',
            checkOut: '2025-04-12',
            nights: 2,
            totalPrice: 320,
            status: 'cancelled',
            propertyImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return { bg: '#dcfce7', text: '#16a34a', icon: FiCheckCircle }
      case 'pending': return { bg: '#fef3c7', text: '#d97706', icon: FiClock }
      case 'completed': return { bg: '#dbeafe', text: '#0284c7', icon: FiCheckCircle }
      case 'cancelled': return { bg: '#fee2e2', text: '#dc2626', icon: FiX }
      default: return { bg: '#f3f4f6', text: '#6b7280', icon: FiClock }
    }
  }

  const filteredBookings = bookings.filter(b => {
    if (filter === 'all') return true
    return b.status === filter
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Open Sans', sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 40 }}
        >
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
              onMouseEnter={e => {
                if (filter !== f.id) {
                  e.currentTarget.style.background = '#f3f4f6'
                }
              }}
              onMouseLeave={e => {
                if (filter !== f.id) {
                  e.currentTarget.style.background = '#fff'
                }
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
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 12,
              padding: '12px 16px',
              color: '#dc2626',
              fontSize: 13,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <FiX size={16} />
            Error: {error}. Showing sample bookings below.
          </motion.div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: '3px solid #e5e7eb',
                borderTopColor: '#093880',
                margin: '0 auto 16px'
              }}
            />
            <p style={{ color: '#9ca3af', fontSize: 14 }}>Loading your bookings...</p>
          </div>
        )}

        {/* Bookings grid */}
        {!loading && filteredBookings.length > 0 && (
          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
            {filteredBookings.map((booking, idx) => {
              const statusColor = getStatusColor(booking.status)
              const StatusIcon = statusColor.icon

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  whileHover={{ y: -4 }}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    border: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.3s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.12)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'
                  }}
                >
                  {/* Image */}
                  <div style={{ position: 'relative', overflow: 'hidden', height: 160 }}>
                    <img
                      src={booking.propertyImage}
                      alt={booking.propertyName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: statusColor.bg,
                      color: statusColor.text,
                      padding: '6px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'capitalize'
                    }}>
                      <StatusIcon size={14} />
                      {booking.status}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '16px' }}>
                    {/* Property name */}
                    <h3 style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#0f172a',
                      marginBottom: 8,
                      lineHeight: 1.3
                    }}>
                      {booking.propertyName}
                    </h3>

                    {/* Location */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 12, marginBottom: 12 }}>
                      <FiMapPin size={14} />
                      {booking.location}
                    </div>

                    {/* Dates */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 12, marginBottom: 12 }}>
                      <FiCalendar size={14} />
                      {booking.checkIn} to {booking.checkOut} ({booking.nights} nights)
                    </div>

                    {/* Guest */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 12, marginBottom: 16 }}>
                      <FiUser size={14} />
                      {booking.guestName}
                    </div>

                    {/* Price and action */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Total price</p>
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 18, fontWeight: 800, color: '#093880' }}>
                          ${booking.totalPrice}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.08, x: 4 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 999,
                          border: 'none',
                          background: 'linear-gradient(135deg, #093880, #1a56c4)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 3px 12px rgba(9,56,128,0.2)'
                        }}
                      >
                        <FiArrowRight size={18} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredBookings.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: 'center',
              padding: '60px 24px',
              background: '#fff',
              borderRadius: 20,
              border: '1px solid #f0f0f0'
            }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 36
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
