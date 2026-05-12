import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiStar, FiMapPin, FiHome, FiCalendar, FiMessageSquare, FiArrowLeft, FiAward, FiClock, FiZap } from 'react-icons/fi'
import { FaStar } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import { useAppData } from '../context/AppDataContext'

const SORT_OPTIONS = ['Most Recent', 'Highest Rated', 'Lowest Rated']

function HostStatPill({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', borderRadius: 16, padding: '16px 24px', border: '1px solid rgba(255,255,255,0.12)', minWidth: 100 }}>
      <Icon size={20} style={{ color: '#0EA5E9' }} />
      <p style={{ fontFamily: "'Sora','Poppins',sans-serif", fontWeight: 800, fontSize: 22, color: '#fff', margin: 0 }}>{value}</p>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600, margin: 0 }}>{label}</p>
    </div>
  )
}

function PropertyChip({ property, navigate }) {
  const { getPropertyAverageRating } = useAppData()
  const avg = getPropertyAverageRating(property.id)
  return (
    <motion.div whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(14,165,233,0.12)' }}
      onClick={() => navigate(`/property/${property.id}`)}
      style={{ background: '#1e293b', borderRadius: 18, border: '1.5px solid #334155', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .25s' }}>
      <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
        <img src={property.image} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(15,23,42,0.8))' }} />
        {avg && (
          <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(8px)', borderRadius: 999, padding: '4px 10px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <FaStar size={11} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{avg}</span>
          </div>
        )}
      </div>
      <div style={{ padding: '14px 16px' }}>
        <h4 style={{ fontFamily: "'Sora','Poppins',sans-serif", fontWeight: 700, fontSize: 14, color: '#f1f5f9', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{property.title}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: 12, marginBottom: 8 }}>
          <FiMapPin size={11} /><span>{property.location}</span>
        </div>
        <span style={{ fontFamily: "'Sora','Poppins',sans-serif", fontWeight: 800, fontSize: 15, color: '#0EA5E9' }}>NPR {property.price?.toLocaleString()}<span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>/night</span></span>
      </div>
    </motion.div>
  )
}

function ReviewRow({ review, index }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      style={{ background: '#1e293b', borderRadius: 16, border: '1.5px solid #334155', padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{review.avatar || review.userName?.charAt(0)?.toUpperCase()}</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', marginBottom: 1 }}>{review.userName}</p>
            <p style={{ fontSize: 11, color: '#64748b' }}>{review.date}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {[1,2,3,4,5].map(s => <FaStar key={s} size={12} style={{ color: s <= review.rating ? '#f59e0b' : '#334155' }} />)}
        </div>
      </div>
      <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.65, borderLeft: '3px solid #334155', paddingLeft: 12 }}>"{review.comment}"</p>
      {review.propertyTitle && (
        <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(14,165,233,0.08)', borderRadius: 8, padding: '3px 10px' }}>
          <FiHome size={10} style={{ color: '#0EA5E9' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#0EA5E9' }}>{review.propertyTitle}</span>
        </div>
      )}
    </motion.div>
  )
}

export default function HostProfilePage() {
  const { hostId } = useParams()
  const navigate = useNavigate()
  const { allProperties, allHostPropertiesRaw, getPropertyReviews, getPropertyAverageRating } = useAppData()
  const [sort, setSort] = useState('Most Recent')
  const [page, setPage] = useState(1)
  const PER_PAGE = 5

  // Find host's properties — check both static and host-uploaded
  const allProps = [...(allProperties || []), ...(allHostPropertiesRaw || [])]
  const hostProps = allProps.filter(p => {
    const hId = p.hostId || p.hostEmail
    return String(hId) === String(hostId)
  })

  // Get host info from first property
  const hostName = hostProps[0]?.hostName || 'Host'
  const hostAvatar = hostProps[0]?.hostAvatar || hostName?.charAt(0)?.toUpperCase()

  // Gather all reviews for this host
  const allReviews = hostProps.flatMap(p => {
    const revs = getPropertyReviews(p.id)
    return revs.map(r => ({ ...r, propertyTitle: p.title, propertyId: p.id }))
  })

  const sorted = [...allReviews].sort((a, b) => {
    if (sort === 'Most Recent') return new Date(b.createdAt) - new Date(a.createdAt)
    if (sort === 'Highest Rated') return b.rating - a.rating
    return a.rating - b.rating
  })

  const totalPages = Math.ceil(sorted.length / PER_PAGE)
  const paged = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const avgRating = allReviews.length > 0
    ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
    : null

  const activeProps = hostProps.filter(p => p.approvalStatus === 'approved' || !p.approvalStatus)

  if (hostProps.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a' }}>
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 24px', textAlign: 'center' }}>
          <FiHome size={52} style={{ color: '#334155', marginBottom: 16 }} />
          <h2 style={{ fontFamily: "'Sora','Poppins',sans-serif", fontWeight: 800, fontSize: 24, color: '#f1f5f9', marginBottom: 8 }}>Host Not Found</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>This host profile doesn't exist or has no listings.</p>
          <button onClick={() => navigate(-1)} style={{ marginTop: 20, padding: '12px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#0EA5E9,#0284c7)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Go Back</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: "'DM Sans','Open Sans',sans-serif" }}>
      <Navbar />

      {/* Hero Section */}
      <div style={{ position: 'relative', background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#0EA5E9 160%)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: activeProps[0]?.image ? `url(${activeProps[0].image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(15,23,42,0.6),rgba(15,23,42,0.95))' }} />
        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto', padding: '60px 24px 40px' }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '7px 14px', cursor: 'pointer', color: '#cbd5e1', fontSize: 13, fontWeight: 600, marginBottom: 32 }}>
            <FiArrowLeft size={14} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 40, fontFamily: "'Sora','Poppins',sans-serif", flexShrink: 0, border: '4px solid rgba(14,165,233,0.3)', boxShadow: '0 8px 32px rgba(14,165,233,0.25)' }}>
              {hostAvatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                <h1 style={{ fontFamily: "'Sora','Poppins',sans-serif", fontWeight: 800, fontSize: 'clamp(22px,4vw,32px)', color: '#fff', margin: 0 }}>{hostName}</h1>
                {avgRating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 999, padding: '4px 12px' }}>
                    <FaStar size={13} style={{ color: '#f59e0b' }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#f59e0b' }}>{avgRating}</span>
                  </div>
                )}
                <span style={{ background: 'rgba(14,165,233,0.15)', color: '#0EA5E9', border: '1px solid rgba(14,165,233,0.3)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>Host</span>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 5 }}><FiCalendar size={13} /> Member since {new Date().getFullYear() - 1}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 5 }}><FiZap size={13} /> ~1h response time</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
            <HostStatPill icon={FiHome} label="Listings" value={activeProps.length} />
            <HostStatPill icon={FaStar} label="Avg Rating" value={avgRating || '—'} />
            <HostStatPill icon={FiMessageSquare} label="Reviews" value={allReviews.length} />
            <HostStatPill icon={FiAward} label="Response" value="98%" />
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>

        {/* Properties Grid */}
        {activeProps.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: "'Sora','Poppins',sans-serif", fontWeight: 700, fontSize: 20, color: '#f1f5f9', marginBottom: 4 }}>Properties by {hostName}</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{activeProps.length} active listing{activeProps.length !== 1 ? 's' : ''}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 18 }}>
              {activeProps.map(p => <PropertyChip key={p.id} property={p} navigate={navigate} />)}
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontFamily: "'Sora','Poppins',sans-serif", fontWeight: 700, fontSize: 20, color: '#f1f5f9', marginBottom: 2 }}>Guest Reviews</h2>
              <p style={{ fontSize: 13, color: '#64748b' }}>{allReviews.length} review{allReviews.length !== 1 ? 's' : ''} · {avgRating ? `${avgRating} avg rating` : 'No ratings yet'}</p>
            </div>
            {allReviews.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {SORT_OPTIONS.map(s => (
                  <button key={s} onClick={() => { setSort(s); setPage(1) }}
                    style={{ padding: '7px 14px', borderRadius: 999, border: `1.5px solid ${sort === s ? '#0EA5E9' : '#334155'}`, background: sort === s ? 'rgba(14,165,233,0.1)' : 'transparent', color: sort === s ? '#0EA5E9' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {paged.length === 0 ? (
            <div style={{ background: '#1e293b', borderRadius: 20, border: '1.5px solid #334155', padding: '64px 32px', textAlign: 'center' }}>
              <FiMessageSquare size={44} style={{ color: '#334155', marginBottom: 12 }} />
              <p style={{ fontFamily: "'Sora','Poppins',sans-serif", fontWeight: 700, fontSize: 16, color: '#64748b' }}>No reviews yet</p>
              <p style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Be the first to book and review this host's properties!</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {paged.map((r, i) => <ReviewRow key={r.id} review={r} index={i} />)}
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)}
                      style={{ width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${page === n ? '#0EA5E9' : '#334155'}`, background: page === n ? '#0EA5E9' : 'transparent', color: page === n ? '#fff' : '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}>
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}
