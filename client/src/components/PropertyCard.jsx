import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiHeart } from 'react-icons/fi'
import { FaHeart, FaStar } from 'react-icons/fa'

export default function PropertyCard({ listing, index = 0 }) {
  const [wishlisted, setWishlisted] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const { title, location, price, rating, reviews, image, tag } = listing

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: 'easeOut' }}
      whileHover={{ y: -6 }}
      style={{ position: 'relative', flexShrink: 0, width: 280, cursor: 'pointer' }}
    >
      {/* Image */}
      <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', aspectRatio: '4/3', background: '#f3f4f6' }}>
        {!imgLoaded && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #f0f0f0 25%, #fafafa 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        )}
        <img
          src={image} alt={title}
          onLoad={() => setImgLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s, transform 0.4s ease' }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        />

        {/* Tag */}
        {tag && (
          <div style={{ position: 'absolute', top: 12, left: 12, background: '#fff', color: '#111827', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
            {tag}
          </div>
        )}

        {/* Wishlist */}
        <button
          id={`wishlist-${listing.id}`}
          onClick={e => { e.stopPropagation(); setWishlisted(w => !w) }}
          style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'transform 0.2s', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          aria-label="Wishlist"
        >
          {wishlisted
            ? <FaHeart style={{ color: '#ef4444', fontSize: 16 }} />
            : <FiHeart style={{ color: '#fff', fontSize: 16, strokeWidth: 2.5 }} />
          }
        </button>
      </div>

      {/* Info */}
      <div style={{ marginTop: 12, padding: '0 2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, color: '#111827', fontSize: 14, lineHeight: 1.3, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
            {title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            <FaStar style={{ color: '#f59e0b', fontSize: 12 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{rating}</span>
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>{location}</p>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 15, color: '#111827' }}>NPR {price.toLocaleString()}</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>/ night</span>
        </div>
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{reviews} reviews</p>
      </div>

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </motion.div>
  )
}
