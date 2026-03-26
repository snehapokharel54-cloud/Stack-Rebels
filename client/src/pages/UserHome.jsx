import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiGrid, FiHome, FiSun, FiWind, FiTriangle, FiFeather, FiCoffee } from 'react-icons/fi'
import { FaUmbrellaBeach, FaCity } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import ListingsRow from '../components/ListingsRow'
import { listings, upcomingListings } from '../data/listings'
import { useNavigate } from 'react-router-dom'

const CATEGORIES = [
  { label: 'All', icon: FiGrid, id: 'all' },
  { label: 'Trending', icon: FiSun, id: 'trending' },
  { label: 'City', icon: FaCity, id: 'city' },
  { label: 'Beach', icon: FaUmbrellaBeach, id: 'beach' },
  { label: 'Mountain', icon: FiTriangle, id: 'mountain' },
  { label: 'Countryside', icon: FiHome, id: 'countryside' },
  { label: 'Unique', icon: FiFeather, id: 'unique' },
  { label: 'Cafe', icon: FiCoffee, id: 'cafe' },
  { label: 'Windy', icon: FiWind, id: 'windy' },
]

const BANNER_STATS = [
  { value: '50K+', label: 'Properties' },
  { value: '200K+', label: 'Happy Guests' },
  { value: '4.9★', label: 'Avg Rating' },
]

export default function UserHome() {
  const [activeCategory, setActiveCategory] = useState('all')
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Open Sans', sans-serif" }}>
      <Navbar />

      {/* ── Category pills ────────────────────────────── */}
      <div style={{ position: 'sticky', top: 68, zIndex: 40, background: '#fff', borderBottom: '1px solid #f0f0f0', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 0', scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => {
              const active = activeCategory === cat.id
              return (
                <motion.button
                  key={cat.id}
                  id={`category-${cat.id}`}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '10px 18px', borderRadius: 14, border: 'none', flexShrink: 0,
                    background: active ? 'linear-gradient(135deg, #093880, #1a56c4)' : 'transparent',
                    color: active ? '#fff' : '#6b7280',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s', fontFamily: "'Poppins', sans-serif",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f3f4f6' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <cat.icon size={18} />
                  <span>{cat.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          style={{ borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(135deg, #093880 0%, #1a56c4 100%)', marginBottom: 56, position: 'relative' }}
        >
          <div style={{ position: 'absolute', top: -40, right: -40, width: 260, height: 260, borderRadius: '50%', background: '#63b74e', opacity: 0.12 }} />
          <div style={{ position: 'absolute', bottom: -40, left: '30%', width: 200, height: 200, borderRadius: '50%', background: '#fff', opacity: 0.05 }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, padding: '40px 48px' }}>
            <div>
              <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 999, marginBottom: 16 }}>
                ✨ Discover Nepal
              </span>
              <h2 style={{ fontFamily: "'Poppins', sans-serif", color: '#fff', fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 900, lineHeight: 1.2, marginBottom: 10 }}>
                Find your next<br />perfect stay
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, maxWidth: 300, lineHeight: 1.6 }}>
                From mountain retreats to lakefront villas — explore Nepal's finest stays.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 40 }}>
              {BANNER_STATS.map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Poppins', sans-serif", color: '#fff', fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{s.value}</p>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 4 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Popular listings */}
        <ListingsRow title="🏙️ Popular homes in Kathmandu" listings={listings} />

        {/* Mid-page scenic banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ marginBottom: 56, borderRadius: 20, overflow: 'hidden', height: 180, position: 'relative', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
        >
          <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80" alt="Mountain view" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 48px' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 6 }}>🗺️ Scenic escapes await</p>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Mountain & Nature Stays</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Explore Nagarkot, Bandipur & beyond</p>
            </div>
          </div>
        </motion.div>

        {/* Upcoming listings */}
        <ListingsRow title="📅 Available next month" listings={upcomingListings} />

        {/* Host CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ background: '#fff', borderRadius: 20, padding: '28px 36px', boxShadow: '0 2px 20px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
        >
          <div>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, color: '#0f172a', marginBottom: 4 }}>Have a property to rent out?</h3>
            <p style={{ fontSize: 14, color: '#6b7280' }}>Join as a host and start earning today.</p>
          </div>
          <motion.button
            id="user-home-host-cta-btn"
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/vendor')}
            style={{ padding: '13px 28px', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg, #63b74e, #4d9a3a)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(99,183,78,0.35)', fontFamily: "'Poppins', sans-serif", whiteSpace: 'nowrap' }}
          >
            Become a Host →
          </motion.button>
        </motion.div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #f0f0f0', background: '#fff', padding: '28px 24px', textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 40 }}>
        © 2025 Grihastha · Online Rental System
      </footer>
    </div>
  )
}
