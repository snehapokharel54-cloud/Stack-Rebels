import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiCalendar, FiMapPin, FiUsers, FiClock } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'

export default function BookingHistoryPage() {
  const { getUserBookings, cancelBooking } = useAppData()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('upcoming')

  const allBookings = getUserBookings(user?.email)
  const now = new Date()

  const upcoming = allBookings.filter(b => b.status !== 'cancelled' && new Date(b.checkOut) >= now)
  const past = allBookings.filter(b => b.status === 'cancelled' || new Date(b.checkOut) < now)

  const displayed = activeTab === 'upcoming' ? upcoming : past

  const StatusBadge = ({ status, checkOut }) => {
    const isPast = new Date(checkOut) < now
    const s = status === 'cancelled' ? 'cancelled' : isPast ? 'completed' : 'confirmed'
    const styles = {
      confirmed: { bg: '#ecfdf5', color: '#16a34a', label: 'Confirmed' },
      completed: { bg: '#f3f4f6', color: '#374151', label: 'Completed' },
      cancelled: { bg: '#fef2f2', color: '#dc2626', label: 'Cancelled' },
    }
    const st = styles[s]
    return <span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>{st.label}</span>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Open Sans', sans-serif" }}>
      <Navbar />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center' }}>
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 26, fontWeight: 900, color: '#0f172a', margin: 0 }}>My Bookings</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{allBookings.length} total bookings</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 14, padding: 4, marginBottom: 28, width: 'fit-content' }}>
          {[{ id: 'upcoming', label: `Upcoming (${upcoming.length})` }, { id: 'past', label: `Past (${past.length})` }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: '10px 24px', borderRadius: 11, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Poppins', sans-serif",
                background: activeTab === tab.id ? '#fff' : 'transparent',
                color: activeTab === tab.id ? '#093880' : '#6b7280',
                boxShadow: activeTab === tab.id ? '0 1px 8px rgba(0,0,0,0.08)' : 'none',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {displayed.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📋</div>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 20, color: '#111827', marginBottom: 8 }}>No {activeTab} bookings</h3>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
              {activeTab === 'upcoming' ? 'Start planning your next adventure!' : 'Your past bookings will appear here.'}
            </p>
            {activeTab === 'upcoming' && (
              <button onClick={() => navigate('/home')}
                style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                Find a Place
              </button>
            )}
          </motion.div>
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
                        <button onClick={() => cancelBooking(booking.id)}
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
      </main>
    </div>
  )
}
