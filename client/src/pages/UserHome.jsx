import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiHome, FiSliders, FiGrid, FiSearch, FiMapPin } from 'react-icons/fi'
import { MdOutlineApartment, MdOutlineMeetingRoom } from 'react-icons/md'
import { FaBuilding } from 'react-icons/fa'
import { LuBedDouble } from 'react-icons/lu'
import Navbar from '../components/Navbar'
import PropertyCard from '../components/PropertyCard'
import { useAppData } from '../context/AppDataContext'

const CATEGORIES = [
  { label: 'All',       id: 'all',       Icon: FiGrid },
  { label: 'House',     id: 'house',     Icon: FiHome },
  { label: 'Room',      id: 'room',      Icon: MdOutlineMeetingRoom },
  { label: 'Apartment', id: 'apartment', Icon: MdOutlineApartment },
  { label: 'Building',  id: 'building',  Icon: FaBuilding },
]

const BANNER_STATS = [
  { value: '50K+', label: 'Properties' },
  { value: '200K+', label: 'Happy Guests' },
  { value: '4.9★', label: 'Avg Rating' },
]

const SKELETON_IDS = [1, 2, 3, 4, 5, 6, 7, 8]

function PropertySkeleton() {
  return (
    <div style={{ width: '100%', minWidth: 260, maxWidth: 320 }}>
      <div style={{ borderRadius: 18, overflow: 'hidden', aspectRatio: '4/3', background: 'linear-gradient(90deg, #f0f0f0 25%, #fafafa 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ marginTop: 12 }}>
        <div style={{ height: 14, borderRadius: 8, background: '#f0f0f0', width: '70%', animation: 'shimmer 1.5s infinite' }} />
        <div style={{ height: 11, borderRadius: 8, background: '#f0f0f0', width: '50%', marginTop: 8, animation: 'shimmer 1.5s infinite' }} />
        <div style={{ height: 13, borderRadius: 8, background: '#f0f0f0', width: '40%', marginTop: 8, animation: 'shimmer 1.5s infinite' }} />
      </div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  )
}

export default function UserHome() {
  const {
    filteredProperties,
    searchQuery, setSearchQuery,
    activeCategory, setActiveCategory,
    priceRange, setPriceRange,
  } = useAppData()

  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)

  // Simulate initial load
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900)
    return () => clearTimeout(t)
  }, [])

  const clearSearch = () => {
    setSearchQuery('')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Open Sans', sans-serif" }}>
      <Navbar />

      {/* ── Category pills */}
      <div style={{ position: 'sticky', top: 68, zIndex: 40, background: '#fff', borderBottom: '1px solid #f0f0f0', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 0', scrollbarWidth: 'none' }}>
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
                    padding: '8px 20px', borderRadius: 14, border: active ? 'none' : '1.5px solid #e5e7eb',
                    flexShrink: 0, cursor: 'pointer', transition: 'all 0.2s',
                    background: active ? 'linear-gradient(135deg, #093880, #1a56c4)' : '#fff',
                    color: active ? '#fff' : '#6b7280',
                    fontSize: 11, fontWeight: 700, fontFamily: "'Poppins', sans-serif",
                    boxShadow: active ? '0 4px 16px rgba(9,56,128,0.25)' : 'none',
                  }}
                >
                  <cat.Icon size={17} />
                  <span>{cat.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Main */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          style={{ borderRadius: 28, overflow: 'hidden', background: 'linear-gradient(135deg, #093880 0%, #1a56c4 60%, #2563eb 100%)', marginBottom: 48, position: 'relative' }}
        >
          <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: '#63b74e', opacity: 0.1, filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: -40, left: '25%', width: 200, height: 200, borderRadius: '50%', background: '#fff', opacity: 0.06, filter: 'blur(30px)' }} />

          <div style={{ position: 'relative', padding: '40px 48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32 }}>
              <div>
                <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 999, marginBottom: 16 }}>
                  Discover Nepal
                </span>
                <h2 style={{ fontFamily: "'Poppins', sans-serif", color: '#fff', fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 900, lineHeight: 1.15, marginBottom: 10 }}>
                  Find your next<br />perfect stay
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, maxWidth: 320, lineHeight: 1.6, marginBottom: 28 }}>
                  From mountain retreats to lakefront villas — explore Nepal's finest stays.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 32 }}>
                {BANNER_STATS.map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <p style={{ fontFamily: "'Poppins', sans-serif", color: '#fff', fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{s.value}</p>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 4 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              {(() => { const cat = CATEGORIES.find(c => c.id === activeCategory); return cat ? <><cat.Icon size={20} />{cat.id === 'all' ? 'All Properties' : `${cat.label}s`}</> : 'All Properties' })()}
            </h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} found
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>
          <motion.button
            id="filter-toggle-btn"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowFilters(f => !f)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: showFilters ? '#093880' : '#fff', color: showFilters ? '#fff' : '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <FiSliders size={15} /> Filters
          </motion.button>
        </div>

        {/* Price filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ background: '#fff', borderRadius: 18, padding: '24px 28px', boxShadow: '0 2px 20px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0', marginBottom: 28, overflow: 'hidden' }}
            >
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 16 }}>Price Range (NPR / night)</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 13, color: '#6b7280' }}>Min: NPR</label>
                  <input type="number" value={priceRange[0]} onChange={e => setPriceRange([+e.target.value, priceRange[1]])}
                    style={{ width: 100, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 13, color: '#6b7280' }}>Max: NPR</label>
                  <input type="number" value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], +e.target.value])}
                    style={{ width: 100, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13 }} />
                </div>
                <button onClick={() => setPriceRange([0, 15000])}
                  style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6b7280' }}>
                  Reset
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Property Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
            {SKELETON_IDS.map(i => <PropertySkeleton key={i} />)}
          </div>
        ) : filteredProperties.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <FiSearch size={28} style={{ color: '#9ca3af' }} />
            </div>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 20, color: '#111827', marginBottom: 8 }}>No properties found</h3>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Try adjusting your search or filters</p>
            <button onClick={() => { clearSearch(); setActiveCategory('all'); setPriceRange([0, 15000]) }}
              style={{ marginTop: 20, padding: '11px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Clear Filters
            </button>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
            {filteredProperties.map((listing, i) => (
              <PropertyCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        )}

        {/* Mid-page scenic banner */}
        {!loading && filteredProperties.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            style={{ margin: '56px 0', borderRadius: 20, overflow: 'hidden', height: 180, position: 'relative', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
          >
            <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80" alt="Mountain view" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 48px' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><FiMapPin size={13} /> Scenic escapes await</p>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Mountain & Nature Stays</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Explore Nagarkot, Bandipur & beyond</p>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #f0f0f0', background: '#fff', padding: '28px 24px', textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 40 }}>
        © 2025 Grihastha · Online Rental System
      </footer>
    </div>
  )
}
