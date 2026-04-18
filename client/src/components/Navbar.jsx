import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiLogOut, FiMenu, FiX, FiHeart, FiBell, FiBook } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useAppData } from '../context/AppDataContext'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

const NEPAL_LOCATIONS = [
  'Thamel, Kathmandu', 'Patan Durbar Square', 'Diktel', 'Nagarkot',
  'Pokhara', 'Fewa Lake', 'Chitwan', 'Bandipur', 'Bhaktapur', 'Lalitpur',
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const { unreadCount, searchListings, wishlists } = useAppData()
  const wishlistCount = wishlists?.reduce((sum, wl) => sum + (wl.listings?.length || 0), 0) || 0
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [localSearch, setLocalSearch] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSug, setShowSug] = useState(false)
  const debounceRef = useRef(null)
  const profileRef = useRef(null)

  const handleLogout = () => { logout(); showToast('You have been signed out.', 'info'); navigate('/') }

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearchInput = useCallback((val) => {
    setLocalSearch(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      searchListings({ location: val })
      if (val.trim()) {
        const s = NEPAL_LOCATIONS.filter(l => l.toLowerCase().includes(val.toLowerCase())).slice(0, 4)
        setSuggestions(s)
        setShowSug(s.length > 0)
      } else {
        setSuggestions([]); setShowSug(false)
      }
    }, 300)
  }, [searchListings])

  const selectSug = (loc) => { setLocalSearch(loc); searchListings({ location: loc }); setShowSug(false) }
  const clearSearch = () => { setLocalSearch(''); searchListings({ location: '' }); setShowSug(false) }

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      {/* Main bar */}
      <div style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #f0f0f0', height: 68, boxShadow: '0 1px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', gap: 16 }}>

          {/* Logo */}
          <motion.div whileHover={{ scale: 1.02 }} onClick={() => navigate('/home')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}>
            <img src="/grihastha-logo.svg" alt="Grihastha" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 20, color: '#093880' }}>Grihastha</span>
          </motion.div>

          {/* Search bar */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', maxWidth: 520, width: '100%' }}>
              <div style={{
                display: 'flex', alignItems: 'center', background: '#fff',
                borderRadius: 999, border: '1.5px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                overflow: 'visible', cursor: 'text', transition: 'box-shadow 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'}
              >
                <FiSearch size={16} style={{ color: '#9ca3af', marginLeft: 16, flexShrink: 0 }} />
                <input
                  id="navbar-search-input"
                  type="text"
                  value={localSearch}
                  onChange={e => handleSearchInput(e.target.value)}
                  onFocus={() => localSearch && setShowSug(suggestions.length > 0)}
                  placeholder="Search location or property..."
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent', padding: '11px 10px', fontFamily: "'Open Sans', sans-serif" }}
                />
                {localSearch && (
                  <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0 8px', display: 'flex' }}>
                    <FiX size={15} />
                  </button>
                )}
                <motion.button
                  id="navbar-search-btn"
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  style={{ width: 38, height: 38, borderRadius: 999, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 3px 12px rgba(9,56,128,0.3)', margin: '4px 4px 4px 0', flexShrink: 0 }}
                  aria-label="Search"
                >
                  <FiSearch size={15} />
                </motion.button>
              </div>

              {/* Search suggestions */}
              <AnimatePresence>
                {showSug && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 200 }}>
                    {suggestions.map(s => (
                      <button key={s} onClick={() => selectSug(s)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 16px', border: 'none', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151', textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <FiSearch size={13} style={{ color: '#9ca3af' }} /> {s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right icons — desktop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {user ? (
              <>
                {/* Wishlist */}
                <motion.button id="navbar-wishlist-btn" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/wishlist')}
                  title="Wishlist"
                  style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#374151' }}>
                  <FiHeart size={17} />
                  {wishlistCount > 0 && (
                    <span style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {wishlistCount}
                    </span>
                  )}
                </motion.button>                {/* Notifications */}
                <motion.button id="navbar-notif-btn" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/notifications')}
                  title="Notifications"
                  style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#374151' }}>
                  <FiBell size={17} />
                  {unreadCount > 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                      style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {unreadCount}
                    </motion.span>
                  )}
                </motion.button>

                {/* My Bookings link (Direct) */}
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/bookings')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', color: '#374151', fontSize: 13, fontWeight: 600 }}
                >
                  <FiBook size={15} /> <span>My Bookings</span>
                </motion.button>

                {/* Profile dropdown */}
                <div ref={profileRef} style={{ position: 'relative' }}>
                  <motion.button id="navbar-profile-btn" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setProfileOpen(o => !o)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 6px', borderRadius: 999, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #093880, #1a56c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: "'Poppins', sans-serif" }}>
                      {user?.avatar}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name?.split(' ')[0]}</span>
                  </motion.button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 220, background: '#fff', borderRadius: 18, boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1.5px solid #f0f0f0', overflow: 'hidden', zIndex: 300 }}>
                    <div style={{ padding: '16px 18px', borderBottom: '1px solid #f0f0f0' }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{user?.name}</p>
                      <p style={{ fontSize: 12, color: '#9ca3af', textTransform: 'capitalize' }}>{user?.role} account</p>
                    </div>
                    {[
                      { label: 'My Bookings', icon: FiBook, action: () => { navigate('/bookings'); setProfileOpen(false) } },
                      { label: 'Wishlist', icon: FiHeart, action: () => { navigate('/wishlist'); setProfileOpen(false) } },
                      { label: 'Notifications', icon: FiBell, action: () => { navigate('/notifications'); setProfileOpen(false) } },
                    ].map(item => (
                      <button key={item.label} onClick={item.action}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 18px', border: 'none', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151', textAlign: 'left', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <item.icon size={14} style={{ color: '#6b7280' }} /> {item.label}
                        {item.label === 'Notifications' && unreadCount > 0 && (
                          <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999 }}>{unreadCount}</span>
                        )}
                        {item.label === 'Wishlist' && wishlistCount > 0 && (
                          <span style={{ marginLeft: 'auto', background: '#f3f4f6', color: '#374151', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999 }}>{wishlistCount}</span>
                        )}
                      </button>
                    ))}
                    <div style={{ borderTop: '1px solid #f0f0f0', padding: '8px 8px' }}>
                      <button onClick={handleLogout}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 10px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#dc2626', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <FiLogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/auth?mode=login')}
            style={{ padding: '8px 20px', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>
            Sign In
          </motion.button>
        )}

        {/* Mobile toggle */}
        <button onClick={() => setMobileOpen(o => !o)}
              style={{ display: 'none', padding: 8, borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer', color: '#374151' }}
              className="mobile-menu-btn" aria-label="Menu">
              {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #f0f0f0', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #093880, #1a56c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>
                    {user?.avatar}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{user?.name}</p>
                    <p style={{ fontSize: 12, color: '#9ca3af', textTransform: 'capitalize' }}>{user?.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => { navigate('/bookings'); setMobileOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '11px 16px', borderRadius: 12, border: 'none', background: '#f3f4f6', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  <FiBook size={15} /> My Bookings
                </button>
                <button
                  onClick={handleLogout}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '11px 16px', borderRadius: 12, border: 'none', background: '#fef2f2', color: '#dc2626', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  <FiLogOut size={15} /> Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/auth?mode=login')}
                style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '11px 16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Sign In
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
