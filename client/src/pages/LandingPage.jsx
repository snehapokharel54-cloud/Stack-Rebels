import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiArrowRight, FiMapPin, FiStar, FiShield, FiHeart } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useAppData } from '../context/AppDataContext'
import PropertyCard from '../components/PropertyCard'

const HERO_STATS = [
  { label: 'Properties', value: '50K+' },
  { label: 'Happy Guests', value: '200K+' },
  { label: 'Cities', value: '120+' },
]

const FEATURES = [
  { icon: FiSearch, title: 'Discover Stays', desc: 'Browse thousands of curated homes, villas, and unique hideaways across Nepal.' },
  { icon: FiStar, title: 'Verified Quality', desc: 'Every listing is rated and reviewed by real guests you can trust.' },
  { icon: FiShield, title: 'Secure Booking', desc: 'Your payments and personal data are always fully protected.' },
  { icon: FiHeart, title: 'Local Experience', desc: 'Find hidden gems recommended by locals and seasoned travelers.' },
]


export default function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { listings, listingsLoading, searchListings } = useAppData()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(user.role === 'vendor' ? '/vendor' : '/home', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    // Only search if not redirecting
    if (!isAuthenticated) {
      searchListings({ limit: 4 })
    }
  }, [isAuthenticated, searchListings])

  const mappedListings = (listings || []).map(l => {
    const images = l.photos?.length > 0
      ? l.photos.sort((a, b) => a.position - b.position).map(p => p.url)
      : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800']
    const address = typeof l.address === 'string' ? JSON.parse(l.address || '{}') : (l.address || {})
    return {
      id: l.id,
      title: l.title,
      location: `${address.city || ''}, ${address.province || ''}`.replace(/^[,\s]+|[,\s]+$/g, '') || 'Nepal',
      price: l.price_per_night,
      rating: Number(l.average_rating) || 0,
      reviewCount: Number(l.review_count) || 0,
      category: l.category,
      image: images[0],
      images,
      hostName: l.host_name,
      hostAvatar: l.host_avatar,
    }
  })

  return (
    <div style={{ fontFamily: "'Open Sans', sans-serif", backgroundColor: '#fff', overflowX: 'hidden' }}>

      {/* ── NAVBAR ──────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)', height: 64,
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img src="/grihastha-logo.svg" alt="Grihastha" style={{ width: 34, height: 34, objectFit: 'contain' }} />
            <span style={{ fontSize: 20, fontWeight: 800, color: '#093880', fontFamily: "'Poppins', sans-serif" }}>Grihastha</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              id="landing-become-host-btn"
              onClick={() => navigate('/auth?mode=signup&role=vendor')}
              style={{ padding: '8px 16px', borderRadius: 999, border: 'none', background: 'transparent', fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
              onMouseEnter={e => e.target.style.background = '#f3f4f6'}
              onMouseLeave={e => e.target.style.background = 'transparent'}
            >
              Become a Host
            </button>
            <motion.button
              id="landing-login-btn"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/auth?mode=login')}
              style={{ padding: '10px 24px', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(9,56,128,0.35)', fontFamily: "'Poppins', sans-serif" }}
            >
              Log in
            </motion.button>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', paddingTop: 64,
        background: 'linear-gradient(160deg, #f0f5ff 0%, #eaf4f0 50%, #f5efff 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative blobs */}
        <div style={{ position: 'absolute', top: 80, left: -120, width: 400, height: 400, borderRadius: '50%', background: '#093880', opacity: 0.07, filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: 60, right: -120, width: 400, height: 400, borderRadius: '50%', background: '#63b74e', opacity: 0.08, filter: 'blur(80px)' }} />

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px', textAlign: 'center', position: 'relative' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 999, background: '#e8f0fe', color: '#093880', fontSize: 13, fontWeight: 700, border: '1px solid #c7d9f9', marginBottom: 28 }}>
              Grihastha Online Rental System
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(40px, 7vw, 68px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, marginBottom: 20 }}
          >
            Find your perfect{' '}
            <span style={{ color: '#093880', position: 'relative', display: 'inline-block' }}>
              stay
              <motion.span
                initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
                style={{ position: 'absolute', bottom: -4, left: 0, height: 4, background: '#63b74e', borderRadius: 999, display: 'block' }}
              />
            </span>
            {' '}in Nepal
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            style={{ fontSize: 18, color: '#6b7280', lineHeight: 1.7, marginBottom: 44, maxWidth: 560, margin: '0 auto 44px' }}
          >
            Discover handpicked homes, villas & unique stays across Nepal. From city apartments to mountain retreats.
          </motion.p>

          {/* ── STATS ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
            style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 52 }}
          >
            {HERO_STATS.map((s, i) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                {i > 0 && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 1, height: 32, background: '#e5e7eb' }} />}
                <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 32, fontWeight: 900, color: '#093880', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURED PROPERTIES ──────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Featured properties</h2>
            <p style={{ fontSize: 16, color: '#6b7280' }}>Handpicked stays for your next adventure</p>
          </div>
          <button onClick={() => navigate('/home')} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', color: '#093880', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            View All <FiArrowRight size={16} />
          </button>
        </motion.div>

        {listingsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ width: '100%' }}>
                <div style={{ borderRadius: 18, overflow: 'hidden', aspectRatio: '4/3', background: 'linear-gradient(90deg, #f0f0f0 25%, #fafafa 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                <div style={{ marginTop: 12 }}>
                  <div style={{ height: 14, borderRadius: 8, background: '#f0f0f0', width: '70%', animation: 'shimmer 1.5s infinite' }} />
                  <div style={{ height: 11, borderRadius: 8, background: '#f0f0f0', width: '50%', marginTop: 8, animation: 'shimmer 1.5s infinite' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
            {mappedListings.slice(0, 4).map((listing, i) => (
              <PropertyCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', background: 'linear-gradient(160deg, #f8faff 0%, #f0faf0 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Why Grihastha?</h2>
            <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 480, margin: '0 auto' }}>Everything you need for a perfect stay, all in one place</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #e8f0fe, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <f.icon size={22} style={{ color: '#093880' }} />
                </div>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 17, color: '#0f172a', marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            style={{ background: 'linear-gradient(135deg, #093880 0%, #1a56c4 100%)', borderRadius: 28, padding: '72px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: '#63b74e', opacity: 0.12 }} />
            <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: '#fff', opacity: 0.06 }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, color: '#fff', marginBottom: 16 }}>Ready to explore?</h2>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.75)', marginBottom: 36, maxWidth: 460, margin: '0 auto 36px' }}>Join thousands of travelers finding their perfect stay across Nepal.</p>
              <motion.button
                id="landing-cta-btn"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/auth?mode=signup&role=user')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#093880', border: 'none', padding: '16px 36px', borderRadius: 999, fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', fontFamily: "'Poppins', sans-serif" }}
              >
                Get Started <FiArrowRight size={16} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #f0f0f0', padding: '28px 24px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
        © 2025 Grihastha · Online Rental System
      </footer>
    </div>
  )
}
