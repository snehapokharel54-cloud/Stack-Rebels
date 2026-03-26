import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiLogOut, FiMenu, FiX } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      {/* Main bar */}
      <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #f0f0f0', height: 68 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', gap: 16 }}>

          {/* Logo */}
          <motion.div whileHover={{ scale: 1.02 }} onClick={() => navigate('/home')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}>
            <img src="/grihastha-logo.svg" alt="Grihastha" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 20, color: '#093880' }}>Grihastha</span>
          </motion.div>

          {/* Search bar - Desktop */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'stretch', background: '#fff',
              borderRadius: 999, border: '1.5px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              overflow: 'hidden', maxWidth: 560, width: '100%', cursor: 'pointer',
              transition: 'box-shadow 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'}
            >
              <div style={{ flex: 1, padding: '10px 20px', borderRight: '1px solid #f0f0f0' }}>
                <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 2 }}>Location</p>
                <p style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Search destinations</p>
              </div>
              <div style={{ flex: 1, padding: '10px 20px', borderRight: '1px solid #f0f0f0' }}>
                <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 2 }}>Date</p>
                <p style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Add dates</p>
              </div>
              <div style={{ flex: 1, padding: '10px 20px' }}>
                <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 2 }}>Guests</p>
                <p style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Add guests</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '6px 8px 6px 4px' }}>
                <motion.button
                  id="navbar-search-btn"
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                  style={{ width: 40, height: 40, borderRadius: 999, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 3px 12px rgba(9,56,128,0.3)' }}
                  aria-label="Search"
                >
                  <FiSearch size={16} />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #093880, #1a56c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: "'Poppins', sans-serif", boxShadow: '0 3px 10px rgba(9,56,128,0.25)' }}>
                {user?.avatar}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</span>
            </div>

            {/* Logout */}
            <motion.button
              id="navbar-logout-btn"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 999, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Open Sans', sans-serif" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151' }}
            >
              <FiLogOut size={14} /> Logout
            </motion.button>

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              style={{ display: 'none', padding: 8, borderRadius: 999, border: 'none', background: 'none', cursor: 'pointer', color: '#374151' }}
              aria-label="Menu"
            >
              {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #f0f0f0', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #093880, #1a56c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>
                {user?.avatar}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{user?.name}</p>
                <p style={{ fontSize: 12, color: '#9ca3af', textTransform: 'capitalize' }}>{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '11px 16px', borderRadius: 12, border: 'none', background: '#fef2f2', color: '#dc2626', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              <FiLogOut size={15} /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
