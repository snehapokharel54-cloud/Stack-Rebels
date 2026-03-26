import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiLogOut, FiHome } from 'react-icons/fi'
import { FaTools } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'

export default function VendorHome() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(160deg, #f0f5ff 0%, #eaf4f0 100%)', fontFamily: "'Open Sans', sans-serif" }}>

      {/* Header */}
      <header style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #f0f0f0', height: 64 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/grihastha-logo.svg" alt="Grihastha" style={{ width: 34, height: 34, objectFit: 'contain' }} />
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, color: '#093880' }}>
              Grihastha <span style={{ fontSize: 13, fontWeight: 500, color: '#9ca3af' }}>Host</span>
            </span>
          </div>
          <motion.button
            id="vendor-logout-btn"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 999, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Open Sans', sans-serif" }}
          >
            <FiLogOut size={14} /> Logout
          </motion.button>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', maxWidth: 520, width: '100%' }}
        >
          {/* Floating icon */}
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 112, height: 112, borderRadius: 32, background: 'linear-gradient(135deg, #093880, #1a56c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 16px 48px rgba(9,56,128,0.3)' }}
          >
            <FaTools style={{ color: '#fff', fontSize: 42 }} />
          </motion.div>

          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <span style={{ display: 'inline-block', background: '#fff8e1', color: '#d97706', fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 999, border: '1px solid #fde68a', marginBottom: 20 }}>
              🚧 Coming Soon
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.15, marginBottom: 16 }}
          >
            Host Dashboard<br />
            <span style={{ color: '#093880' }}>Work in Progress</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.7, marginBottom: 32, maxWidth: 380, margin: '0 auto 32px' }}
          >
            We're building an amazing dashboard for hosts to list, manage, and grow their rental properties.
          </motion.p>

          {/* User info card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 18, padding: '16px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0', marginBottom: 28 }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #093880, #1a56c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 17, fontFamily: "'Poppins', sans-serif" }}>
              {user?.avatar}
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: '#111827' }}>{user?.name}</p>
              <p style={{ fontSize: 12, color: '#9ca3af' }}>Host Account</p>
            </div>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            style={{ background: '#fff', borderRadius: 20, padding: '24px 28px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: 28, display: 'block' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Development Progress</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#093880' }}>35%</span>
            </div>
            <div style={{ width: '100%', height: 8, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: '35%' }} transition={{ duration: 1.3, delay: 0.6, ease: 'easeOut' }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #093880, #63b74e)', borderRadius: 999 }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              {['Auth ✅', 'Listings ✅', 'Bookings', 'Analytics'].map(s => (
                <span key={s} style={{ fontSize: 11, color: s.includes('✅') ? '#16a34a' : '#9ca3af', fontWeight: s.includes('✅') ? 700 : 400 }}>{s}</span>
              ))}
            </div>
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <motion.button
              id="vendor-notify-btn"
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              style={{ padding: '13px 28px', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(9,56,128,0.3)', fontFamily: "'Poppins', sans-serif" }}
            >
              Notify me when ready
            </motion.button>
            <motion.button
              id="vendor-browse-btn"
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/home')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 999, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}
            >
              <FiHome size={15} /> Browse as Guest
            </motion.button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
