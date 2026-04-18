import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiBell, FiArrowLeft, FiCheck } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import { useAppData } from '../context/AppDataContext'

const TYPE_CONFIG = {
  booking: { emoji: '🎉', bg: '#ecfdf5', border: '#86efac' },
  payment: { emoji: '💳', bg: '#eff6ff', border: '#bfdbfe' },
  listing: { emoji: '🏠', bg: '#fdf4ff', border: '#e9d5ff' },
  reminder: { emoji: '⏰', bg: '#fff7ed', border: '#fed7aa' },
  BOOKING_CONFIRMED: { emoji: '🎉', bg: '#ecfdf5', border: '#86efac' },
  BOOKING_CANCELLED: { emoji: '❌', bg: '#fee2e2', border: '#fecaca' },
  PAYMENT_RECEIVED: { emoji: '💳', bg: '#eff6ff', border: '#bfdbfe' },
  REVIEW_RECEIVED: { emoji: '⭐', bg: '#fffbeb', border: '#fde68a' },
  default: { emoji: '🔔', bg: '#f9fafb', border: '#e5e7eb' },
}

function timeAgo(timestamp) {
  if (!timestamp) return ''
  const diff = Date.now() - new Date(timestamp).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function NotificationsPage() {
  const { notifications, fetchNotifications, markNotificationsRead, markNotificationRead, notificationsLoading } = useAppData()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications().finally(() => setLoading(false))
  }, [fetchNotifications])

  if (loading || notificationsLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Open Sans', sans-serif" }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#093880', animation: 'spin 0.8s linear infinite' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Open Sans', sans-serif" }}>
      <Navbar />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', display: 'flex' }}>
              <FiArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 26, fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiBell size={22} /> Notifications
              </h1>
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{notifications.filter(n => !n.is_read).length} unread</p>
            </div>
          </div>
          {notifications.some(n => !n.is_read) && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={markNotificationsRead}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
              <FiCheck size={14} /> Mark all read
            </motion.button>
          )}
        </div>

        {notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>🔔</div>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 20, color: '#111827', marginBottom: 8 }}>No notifications yet</h3>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Book a property to receive confirmation and updates.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notifications.map((notif, i) => {
              const notifType = notif.type || notif.notification_type || 'default'
              const cfg = TYPE_CONFIG[notifType] || TYPE_CONFIG.default
              const isRead = notif.is_read || notif.read
              return (
                <motion.div key={notif.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => !isRead && markNotificationRead(notif.id)}
                  style={{ background: isRead ? '#fff' : cfg.bg, border: `1.5px solid ${isRead ? '#f0f0f0' : cfg.border}`, borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start', boxShadow: isRead ? 'none' : '0 2px 12px rgba(0,0,0,0.06)', cursor: isRead ? 'default' : 'pointer' }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>{cfg.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <h4 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: '#111827', margin: 0 }}>
                        {notif.title}
                      </h4>
                      <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{timeAgo(notif.created_at || notif.timestamp)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4, lineHeight: 1.55 }}>{notif.message || notif.body}</p>
                    {notif.listing_id && (
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/property/${notif.listing_id}`) }}
                        style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#093880', fontWeight: 700, padding: 0 }}>
                        View property →
                      </button>
                    )}
                  </div>
                  {!isRead && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#093880', flexShrink: 0, marginTop: 4 }} />
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
