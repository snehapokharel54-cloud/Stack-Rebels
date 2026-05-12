import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiHeart, FiArrowLeft } from 'react-icons/fi'
import { FaStar } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import { useAppData } from '../context/AppDataContext'

export default function WishlistPage() {
  const { wishlist, allProperties, toggleWishlist } = useAppData()
  const navigate = useNavigate()

  const wishlisted = allProperties.filter(p => wishlist.includes(p.id))

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Open Sans', sans-serif" }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#374151', fontWeight: 600, fontSize: 14, padding: 0 }}>
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiHeart style={{ color: '#ef4444' }} size={24} /> My Wishlist
            </h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{wishlisted.length} saved propert{wishlisted.length !== 1 ? 'ies' : 'y'}</p>
          </div>
        </div>

        {wishlisted.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <FiHeart size={32} style={{ color: '#ef4444' }} />
            </div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 22, color: '#111827', marginBottom: 8 }}>No saved properties yet</h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>Click the heart icon on any property to save it here.</p>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => navigate('/home')}
              style={{ padding: '13px 28px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>
              Browse Properties
            </motion.button>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {wishlisted.map((property, i) => (
              <motion.div key={property.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 20px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0', cursor: 'pointer' }}
                onClick={() => navigate(`/property/${property.id}`)}
              >
                <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                  <img src={property.image} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
                  <button
                    onClick={e => { e.stopPropagation(); toggleWishlist(property.id) }}
                    style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(239,68,68,0.15)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <FiHeart size={16} style={{ color: '#ef4444', fill: '#ef4444' }} />
                  </button>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 4 }}>{property.title}</h3>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{property.location}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 15, color: '#111827' }}>NPR {property.price.toLocaleString()}</span>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}> / night</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FaStar style={{ color: '#f59e0b' }} size={12} />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{property.rating || 'New'}</span>
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
