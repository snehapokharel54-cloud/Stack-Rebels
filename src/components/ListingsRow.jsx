import { useRef } from 'react'
import { motion } from 'framer-motion'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import PropertyCard from './PropertyCard'

export default function ListingsRow({ title, listings }) {
  const scrollRef = useRef(null)
  const scroll = (dir) => scrollRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' })

  return (
    <section style={{ marginBottom: 64 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}
      >
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>{title}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ dir: -1, icon: FiChevronLeft }, { dir: 1, icon: FiChevronRight }].map(({ dir, icon: Icon }, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
              onClick={() => scroll(dir)}
              style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', transition: 'all 0.2s', color: '#374151' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#d1d5db' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb' }}
            >
              <Icon size={17} />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Scroll row */}
      <div
        ref={scrollRef}
        style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`.hide-sb::-webkit-scrollbar{display:none}`}</style>
        {listings.map((listing, i) => (
          <PropertyCard key={listing.id} listing={listing} index={i} />
        ))}
      </div>
    </section>
  )
}
