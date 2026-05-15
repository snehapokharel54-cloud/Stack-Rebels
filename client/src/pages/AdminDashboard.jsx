import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiHome, FiUsers, FiShield, FiActivity, FiLogOut, FiCheck, FiX, FiEye, FiTrash2, FiMenu, FiAlertCircle, FiFileText, FiRefreshCw, FiMessageSquare, FiStar, FiCreditCard, FiLock, FiClock, FiAward, FiMinus, FiPlus } from 'react-icons/fi'
import { FaStar } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { useAppData } from '../context/AppDataContext'
import { useToast } from '../context/ToastContext'
import { adminAPI as api, messagingAPI } from '../services/api'
import CryptoJS from 'crypto-js'
import { io } from 'socket.io-client'

const SECRET_KEY = 'grihastha_default_secret_key'

const NAV = [
  { id: 'overview', label: 'Overview', icon: FiActivity },
  { id: 'users', label: 'User Management', icon: FiUsers },
  { id: 'kyc', label: 'KYC Queue', icon: FiShield },
  { id: 'properties', label: 'Property Verification', icon: FiHome },
  { id: 'disputes', label: 'Disputes', icon: FiAlertCircle },
  { id: 'reviews', label: 'Reviews', icon: FiMessageSquare },
  { id: 'audit', label: 'Audit Log', icon: FiClock },
]

function StatusBadge({ status }) {
  const styles = {
    pending:  { color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a' },
    approved: { color: '#065f46', background: '#f0fdf4', border: '1px solid #86efac' },
    rejected: { color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca' },
    active:   { color: '#065f46', background: '#f0fdf4', border: '1px solid #86efac' },
    removed:  { color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca' },
    user:     { color: '#1e40af', background: '#eff6ff', border: '1px solid #bfdbfe' },
    vendor:   { color: '#5b21b6', background: '#f5f3ff', border: '1px solid #ddd6fe' },
  }
  const s = styles[status] || { color: '#374151', background: '#f9fafb', border: '1px solid #e5e7eb' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: 'capitalize', ...s }}>
      {status}
    </span>
  )
}

function StatCard({ label, value, icon: Icon, color, bg, gradient }) {
  return (
    <motion.div whileHover={{ y: -5, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }} transition={{ duration: 0.2 }}
      style={{ background: '#fff', borderRadius: 20, padding: '22px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1.5px solid #f0f4ff', display: 'flex', alignItems: 'flex-start', gap: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 20px 0 80px', background: bg, opacity: 0.45 }} />
      <div style={{ width: 48, height: 48, borderRadius: 14, background: gradient || bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 14px ${color}33` }}>
        <Icon size={22} style={{ color: gradient ? '#fff' : color }} />
      </div>
      <div style={{ position: 'relative' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{label}</p>
        <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 26, color: '#0f172a', lineHeight: 1 }}>{value}</p>
      </div>
    </motion.div>
  )
}

function OverviewSection({ stats }) {
  return (
    <div>
      {/* Welcome header */}
      <div style={{ background: 'linear-gradient(135deg,#0a2342 0%,#093880 60%,#1a56c4 100%)', borderRadius: 20, padding: '28px 32px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Admin Dashboard</p>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 26, color: '#fff', marginBottom: 4, lineHeight: 1.2 }}>Platform Overview</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>Monitor users, properties, KYC verifications and platform health.</p>
      </div>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 18, marginBottom: 24 }}>
        <StatCard label="Total Users" value={stats.totalUsers} icon={FiUsers} color="#093880" bg="#eff6ff" gradient="linear-gradient(135deg,#093880,#1a56c4)" />
        <StatCard label="Host Accounts" value={stats.totalVendors} icon={FiHome} color="#10b981" bg="#ecfdf5" gradient="linear-gradient(135deg,#059669,#10b981)" />
        <StatCard label="Pending Review" value={stats.pendingProperties} icon={FiShield} color="#d97706" bg="#fffbeb" gradient="linear-gradient(135deg,#d97706,#f59e0b)" />
        <StatCard label="Total Bookings" value={stats.totalBookingsCount} icon={FiActivity} color="#6366f1" bg="#eef2ff" gradient="linear-gradient(135deg,#4f46e5,#6366f1)" />
        <StatCard label="Total Reviews" value={stats.totalReviews ?? 0} icon={FiMessageSquare} color="#ec4899" bg="#fdf2f8" gradient="linear-gradient(135deg,#db2777,#ec4899)" />
      </div>
      {/* Property status row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Approved Properties', value: stats.approvedProperties, color: '#059669', bg: '#f0fdf4', border: '#86efac' },
          { label: 'Pending Approval', value: stats.pendingProperties, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          { label: 'Rejected', value: stats.rejectedProperties, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 18, padding: '22px 24px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 32, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 8 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function UserManagementSection() {
  const { showToast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [removeModal, setRemoveModal] = useState(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.getUsers()
        if (data.success) {
          setUsers(data.data)
        }
      } catch (err) {
        console.error('Failed to fetch users:', err)
        showToast('Failed to fetch users.', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [showToast])

  const handleRemove = (user) => { setRemoveModal(user); setReason('') }
  const confirmRemove = () => {
    if (!reason.trim()) { showToast('Please provide a reason.', 'warning'); return }
    adminRemoveUser(removeModal.id, reason)
    showToast(`User "${removeModal.name}" has been removed.`, 'success')
    setRemoveModal(null)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 24, color: '#0f172a', margin: 0, marginBottom: 4 }}>User Management</h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{users.length} registered account{users.length !== 1 ? 's' : ''}</p>
      </div>
      <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #f0f4ff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #f1f5f9', background: '#f8fafc' }}>
                {['User', 'Role', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
               {users.map((u, i) => {
                  const userName = u.full_name || u.name || 'Unknown'
                  const userEmail = u.email
                  const userRole = u.role || (u.is_host ? 'vendor' : 'user')
                  const userJoined = u.created_at || u.createdAt || 'N/A'
                  const userStatus = u.status || 'active'

                  return (
                    <motion.tr key={u.id || u.email} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      style={{ borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#093880,#1a56c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', marginBottom: 2 }}>{userName}</p>
                        <p style={{ fontSize: 12, color: '#94a3b8' }}>{userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}><StatusBadge status={userRole} /></td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#64748b' }}>{userJoined !== 'N/A' ? new Date(userJoined).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '14px 20px' }}><StatusBadge status={userStatus} /></td>
                  <td style={{ padding: '14px 20px' }}>
                    {userStatus === 'removed' ? (
                      <button onClick={() => { adminRestoreUser(u.id); showToast(`User "${u.name}" restored.`, 'success') }}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#f0fdf4', color: '#16a34a', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        <FiRefreshCw size={11} /> Restore
                      </button>
                    ) : (
                      <button onClick={() => handleRemove(u)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        <FiTrash2 size={11} /> Remove
                      </button>
                    )}
                  </td>
                </motion.tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {removeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mx-auto mb-4">
                <FiAlertCircle size={28} className="text-red-500" />
              </div>
              <h3 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-lg font-black text-center text-gray-900 mb-2">Remove User?</h3>
              <p className="text-sm text-gray-500 text-center mb-5">You are removing <strong>{removeModal.name}</strong>. Please provide a reason.</p>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Reason for removal..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none outline-none focus:border-blue-500 mb-4" />
              <div className="flex gap-3">
                <button onClick={() => setRemoveModal(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={confirmRemove} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600">Confirm Remove</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PropertyVerificationSection() {
  const { allHostPropertiesRaw, adminApproveProperty, adminRejectProperty, fetchAdminListings } = useAppData()
  const { showToast } = useToast()
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [docPreview, setDocPreview] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchAdminListings()
  }, [fetchAdminListings])

  const filtered = filter === 'all' ? allHostPropertiesRaw : allHostPropertiesRaw.filter(p => p.approvalStatus === filter)

  const handleApprove = (p) => {
    adminApproveProperty(p.id)
    showToast(`"${p.title}" approved! Vendor notified ✅`, 'success')
  }
  const handleReject = () => {
    if (!rejectReason.trim()) { showToast('Please enter a rejection reason.', 'warning'); return }
    adminRejectProperty(rejectModal.id, rejectReason)
    showToast(`"${rejectModal.title}" rejected. Vendor notified.`, 'error')
    setRejectModal(null); setRejectReason('')
  }

  const filters = ['all', 'pending', 'approved', 'rejected']

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 24, color: '#0f172a', margin: 0, marginBottom: 4 }}>Property Verification</h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{allHostPropertiesRaw.length} submitted propert{allHostPropertiesRaw.length !== 1 ? 'ies' : 'y'}</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 16px', borderRadius: 999, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s', background: filter === f ? 'linear-gradient(135deg,#093880,#1a56c4)' : '#f1f5f9', color: filter === f ? '#fff' : '#64748b' }}>
            {f === 'all' ? `All (${allHostPropertiesRaw.length})` : `${f} (${allHostPropertiesRaw.filter(p => p.approvalStatus === f).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <FiShield size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-400">No properties in this category</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex gap-4 p-5">
                <img src={p.image} alt={p.title} className="w-28 h-20 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-gray-900 text-sm leading-snug">{p.title}</h3>
                    <StatusBadge status={p.approvalStatus || 'pending'} />
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{p.location} · <span className="capitalize">{p.category}</span></p>
                  <p className="text-xs text-gray-400">Host: {p.hostName} · NPR {p.price?.toLocaleString()}/night</p>
                  {p.approvalStatus === 'rejected' && p.rejectionReason && (
                    <p className="text-xs text-red-500 mt-1.5 bg-red-50 px-2 py-1 rounded-lg">❌ {p.rejectionReason}</p>
                  )}
                  {/* Legal docs section */}
                  <div className="flex items-center gap-2 mt-2">
                    {p.legalDocName ? (
                      <button onClick={() => setDocPreview(p)}
                        className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 font-semibold transition-colors">
                        <FiFileText size={11} /> {p.legalDocName}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No legal document uploaded</span>
                    )}
                  </div>
                </div>
              </div>
              {p.approvalStatus === 'pending' && (
                <div className="flex gap-2 px-5 pb-4">
                  <button onClick={() => handleApprove(p)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors">
                    <FiCheck size={13} /> Approve
                  </button>
                  <button onClick={() => { setRejectModal(p); setRejectReason('') }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors">
                    <FiX size={13} /> Reject
                  </button>
                  <button onClick={() => setDocPreview(p)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors">
                    <FiEye size={13} /> Preview
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h3 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-lg font-black text-gray-900 mb-1">Reject Property</h3>
              <p className="text-sm text-gray-500 mb-4">Provide a reason for rejecting <strong>"{rejectModal.title}"</strong></p>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="e.g. Incomplete information, invalid documents..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none outline-none focus:border-red-400 mb-4" />
              <div className="flex gap-3">
                <button onClick={() => setRejectModal(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={handleReject} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600">Reject Property</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Doc preview modal */}
      <AnimatePresence>
        {docPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDocPreview(null)}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 style={{ fontFamily: 'Poppins, sans-serif' }} className="font-black text-gray-900">Property Details</h3>
                <button onClick={() => setDocPreview(null)} className="text-gray-400 hover:text-gray-700"><FiX size={20} /></button>
              </div>
              <img src={docPreview.image} alt="" className="w-full h-48 object-cover rounded-xl mb-4" />
              <p className="font-bold text-gray-900 mb-1">{docPreview.title}</p>
              <p className="text-sm text-gray-500 mb-3">{docPreview.location}</p>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{docPreview.description || 'No description provided.'}</p>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Legal Document</p>
                {docPreview.legalDocName ? (
                  <a href={docPreview.legalDocUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 font-semibold hover:underline">
                    <FiFileText size={16} /> {docPreview.legalDocName}
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full ml-auto">View Document ↗</span>
                  </a>
                ) : (
                  <p className="text-sm text-red-500">No document uploaded</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Admin Reviews Management ────────────────────────────────────────────────
function AdminReviewsSection() {
  const { showToast } = useToast()
  const [allReviews, setAllReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState(null)
  const [filterProp, setFilterProp] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await api.getReviews()
        if (data.success) {
          setAllReviews(data.data)
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err)
        showToast('Failed to fetch reviews.', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchReviews()
  }, [showToast])

  const totalAvg = allReviews.length > 0
    ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
    : null

  const filtered = allReviews.filter(r => {
    const propMatch = filterProp === 'all' || String(r.propertyId) === String(filterProp)
    const ratingMatch = ratingFilter === 'all' || r.rating === Number(ratingFilter)
    return propMatch && ratingMatch
  })

  const handleDelete = (review) => setDeleteModal(review)
  const confirmDelete = async () => {
    try {
      const { data } = await api.deleteReview(deleteModal.id)
      if (data.success) {
        showToast('Review deleted successfully.', 'success')
        setDeleteModal(null)
        const response = await api.getReviews()
        if (response.data.success) setAllReviews(response.data.data)
      }
    } catch (err) {
      console.error('Failed to delete review:', err)
      showToast('Failed to delete review.', 'error')
    }
  }

  // Unique property list for filter
  const propOptions = [...new Map(
    allReviews.map(r => [String(r.propertyId), { id: r.propertyId, title: r.propertyTitle }])
  ).values()]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 24, color: '#0f172a', margin: 0, marginBottom: 4 }}>Reviews Management</h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{allReviews.length} total review{allReviews.length !== 1 ? 's' : ''} across all properties</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Reviews', value: allReviews.length, color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Platform Avg Rating', value: totalAvg || '—', color: '#d97706', bg: '#fffbeb' },
          { label: 'Properties w/ Reviews', value: propOptions.length, color: '#059669', bg: '#f0fdf4' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 18, padding: '20px 24px', border: '1.5px solid #f0f4ff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <p style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 900, fontSize: 30, color: s.color, lineHeight: 1, marginBottom: 6 }}>{s.value}</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <select value={filterProp} onChange={e => setFilterProp(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 bg-white outline-none focus:border-blue-500">
          <option value="all">All Properties</option>
          {propOptions.map(p => <option key={p.id} value={String(p.id)}>{p.title}</option>)}
        </select>
        <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 bg-white outline-none focus:border-blue-500">
          <option value="all">All Ratings</option>
          {[5,4,3,2,1].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n} star{n !== 1 ? 's' : ''})</option>)}
        </select>
        <span className="text-sm text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <FiMessageSquare size={44} className="text-gray-200 mx-auto mb-3" />
          <p className="font-bold text-gray-400 text-lg">No reviews found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex gap-4 items-start">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #093880, #1a56c4)' }}>
                  {r.avatar || r.userName?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                    <div>
                      <span className="font-bold text-sm text-gray-900">{r.userName}</span>
                      <span className="text-xs text-gray-400 ml-2">{r.date}</span>
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(s => <FaStar key={s} size={12} style={{ color: s <= r.rating ? '#f59e0b' : '#e5e7eb' }} />)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{r.comment}</p>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="inline-flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-1">
                      <FiHome size={11} style={{ color: '#093880' }} />
                      <span className="text-xs font-semibold text-blue-800">{r.propertyTitle}</span>
                    </div>
                    <button onClick={() => handleDelete(r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                      <FiTrash2 size={11} /> Delete Review
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mx-auto mb-4">
                <FiAlertCircle size={28} className="text-red-500" />
              </div>
              <h3 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-lg font-black text-center text-gray-900 mb-2">Delete Review?</h3>
              <p className="text-sm text-gray-500 text-center mb-2">Review by <strong>{deleteModal.userName}</strong></p>
              <p className="text-sm text-gray-400 text-center italic mb-6">"{deleteModal.comment?.slice(0, 80)}{deleteModal.comment?.length > 80 ? '...' : ''}"</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600">Delete Review</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── KYC Queue ───────────────────────────────────────────────────────────────
function KYCQueueSection() {
  const { showToast } = useToast()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [filter, setFilter] = useState('all')
  const [docModal, setDocModal] = useState(null)

  useEffect(() => {
    const fetchKYC = async () => {
      try {
        const { data } = await api.getPendingKYC()
        if (data.success) {
          const mapped = data.data.map(rec => ({
            ...rec,
            status: rec.status === 'under_review' ? 'pending' : rec.status,
            email: rec.host_email,
            name: rec.host_name,
            submittedAt: rec.created_at,
            idFrontName: rec.documents?.front ? "ID Front" : null,
            idBackName: rec.documents?.back ? "ID Back" : null
          }))
          setRecords(mapped)
        }
      } catch (err) {
        console.error('Failed to fetch KYC records:', err)
        showToast('Failed to fetch KYC records.', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchKYC()
  }, [showToast])

  const filtered = filter === 'all' ? records : records.filter(r => r.status === filter)

  const handleApprove = async (userId) => {
    try {
      const { data } = await api.approveKYC(userId)
      if (data.success) {
        showToast('KYC approved successfully!', 'success')
        // Refresh records
        const response = await api.getPendingKYC()
        if (response.data.success) {
          const mapped = response.data.data.map(rec => ({
            ...rec,
            status: rec.status === 'under_review' ? 'pending' : rec.status,
            email: rec.host_email,
            name: rec.host_name,
            submittedAt: rec.created_at,
            idFrontName: rec.documents?.front ? "ID Front" : null,
            idBackName: rec.documents?.back ? "ID Back" : null
          }))
          setRecords(mapped)
        }
      }
    } catch (err) {
      console.error('Failed to approve KYC:', err)
      showToast('Failed to approve KYC.', 'error')
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) { showToast('Please enter a reason.', 'warning'); return }
    try {
      const { data } = await api.rejectKYC(rejectModal, { reason: rejectReason })
      if (data.success) {
        showToast('KYC rejected.', 'error')
        setRejectModal(null)
        setRejectReason('')
        // Refresh records
        const response = await api.getPendingKYC()
        if (response.data.success) {
          const mapped = response.data.data.map(rec => ({
            ...rec,
            status: rec.status === 'under_review' ? 'pending' : rec.status,
            email: rec.host_email,
            name: rec.host_name,
            submittedAt: rec.created_at,
            idFrontName: rec.documents?.front ? "ID Front" : null,
            idBackName: rec.documents?.back ? "ID Back" : null
          }))
          setRecords(mapped)
        }
      }
    } catch (err) {
      console.error('Failed to reject KYC:', err)
      showToast('Failed to reject KYC.', 'error')
    }
  }

  const statusColor = { pending: '#eab308', verified: '#10b981', rejected: '#ef4444', not_submitted: '#64748b' }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 900, fontSize: 24, color: '#0f172a', margin: 0, marginBottom: 4 }}>KYC Queue</h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{records.filter(r => r.status === 'pending').length} pending verification{records.filter(r => r.status === 'pending').length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all','pending','verified','rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 16px', borderRadius: 999, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.18s', background: filter === f ? 'linear-gradient(135deg,#093880,#1a56c4)' : '#f1f5f9', color: filter === f ? '#fff' : '#64748b' }}>
            {f} ({f === 'all' ? records.length : records.filter(r => r.status === f).length})
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #f0f4ff', padding: '60px 24px', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <FiShield size={26} style={{ color: '#cbd5e1' }} />
          </div>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#94a3b8', margin: 0 }}>No KYC records in this category</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((rec, i) => (
            <motion.div key={rec.email} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f0f4ff', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              {/* Card header */}
              <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', borderBottom: rec.status === 'pending' ? '1px solid #f0f4ff' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#093880,#1a56c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
                    {rec.email?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 2 }}>{rec.email}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8' }}>Submitted: {rec.submittedAt ? new Date(rec.submittedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown date'}</p>
                  </div>
                </div>
                {/* Status badge */}
                <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 999, textTransform: 'capitalize',
                  color: statusColor[rec.status],
                  background: statusColor[rec.status] + '18',
                  border: `1px solid ${statusColor[rec.status]}33`
                }}>{rec.status?.replace('_', ' ')}</span>
              </div>

              {/* Documents row */}
              <div style={{ padding: '14px 22px', display: 'flex', gap: 8, flexWrap: 'wrap', background: '#fafbff', borderBottom: rec.status === 'pending' || rec.rejectionReason ? '1px solid #f0f4ff' : 'none' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', width: '100%', marginBottom: 6 }}>Submitted Documents</p>
                {rec.idFrontName && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                    <FiFileText size={11} /> {rec.idFrontName} <span style={{ fontSize: 10, color: '#93c5fd' }}>· Front</span>
                  </span>
                )}
                {rec.idBackName && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                    <FiFileText size={11} /> {rec.idBackName} <span style={{ fontSize: 10, color: '#93c5fd' }}>· Back</span>
                  </span>
                )}
                {!rec.idFrontName && !rec.idBackName && (
                  <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>No documents found</span>
                )}
              </div>

              {/* Rejection reason */}
              {rec.status === 'rejected' && rec.rejectionReason && (
                <div style={{ padding: '12px 22px', background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
                  <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, margin: 0 }}>❌ Rejection reason: {rec.rejectionReason}</p>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ padding: '14px 22px', display: 'flex', gap: 10, flexWrap: 'wrap', borderTop: '1px solid #f0f4ff' }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setDocModal(rec)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <FiEye size={14} /> View Documents
                </motion.button>
                {(rec.status === 'pending' || rec.status === 'under_review') && (<>
                   <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleApprove(rec.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: 'none', background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(16,185,129,0.3)' }}>
                    <FiCheck size={14} /> Approve
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setRejectModal(rec.id); setRejectReason('') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1.5px solid #fecaca', background: '#fff', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    <FiX size={14} /> Reject
                  </motion.button>
                </>)}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              style={{ background: '#fff', borderRadius: 22, padding: 32, maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fef2f2', border: '2px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <FiX size={22} style={{ color: '#dc2626' }} />
              </div>
              <h3 style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 800, fontSize: 18, color: '#0f172a', textAlign: 'center', marginBottom: 6 }}>Reject KYC</h3>
              <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 20 }}>Provide a reason for rejecting <strong>{rejectModal}</strong></p>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                placeholder="e.g. Blurry images, expired ID, illegible document..."
                style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', fontSize: 13, resize: 'none', outline: 'none', marginBottom: 16, fontFamily: 'Open Sans, sans-serif', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setRejectModal(null)}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Cancel</button>
                <button onClick={handleReject}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Reject KYC</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Doc preview modal */}
      <AnimatePresence>
        {docModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDocModal(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 22, padding: 32, maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 800, fontSize: 17, color: '#0f172a', margin: 0 }}>KYC Documents</h3>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>{docModal.email}</p>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>Document: <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>{docModal.ownership_type?.replace('_', ' ') || 'National ID'}</strong></p>
                </div>
                <button onClick={() => setDocModal(null)} style={{ width: 34, height: 34, borderRadius: '50%', border: '1.5px solid #e5e7eb', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <FiX size={16} style={{ color: '#64748b' }} />
                </button>
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>{docModal.ownership_type?.replace('_', ' ') || 'National ID'} Card</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[{key: 'front', label: 'Front Side'}, {key: 'back', label: 'Back Side'}].map(doc => {
                  const fileData = docModal.documents?.[doc.key];
                  return (
                    <div key={doc.label} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 18px', borderRadius: 14, border: '1.5px solid #e2e8f0', background: fileData ? '#fafbff' : '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: fileData ? '#eff6ff' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FiFileText size={20} style={{ color: fileData ? '#1d4ed8' : '#cbd5e1' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', margin: 0 }}>{doc.label}</p>
                          <p style={{ fontSize: 12, color: fileData ? '#64748b' : '#94a3b8', margin: '3px 0 0' }}>{fileData ? 'Uploaded' : 'Not uploaded'}</p>
                        </div>
                        {fileData && <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#f0fdf4', padding: '3px 10px', borderRadius: 999, border: '1px solid #86efac' }}>✓ Uploaded</span>}
                      </div>
                      {fileData?.url && (
                        <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#000' }}>
                          <img src={fileData.url} alt={doc.label} style={{ width: '100%', maxHeight: 300, objectFit: 'contain' }} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 12, background: '#e0f2fe', border: '1px solid #bae6fd' }}>
                <p style={{ fontSize: 12, color: '#0369a1', margin: 0 }}>ℹ Documents are securely stored in Cloudinary and previewed above.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
// ─── Disputes Section ────────────────────────────────────────────────────────
function DisputesSection() {
  const { showToast } = useToast()
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  
  const [selectedDispute, setSelectedDispute] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const { data } = await api.getDisputes()
        if (data.success) {
          setDisputes(data.data)
        }
      } catch (err) {
        console.error('Failed to fetch disputes:', err)
        showToast('Failed to fetch disputes.', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchDisputes()
  }, [showToast])

  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'
    const s = io(API_BASE_URL)
    setSocket(s)

    return () => {
      s.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!selectedDispute || !socket) return

    socket.emit('join_conversation', selectedDispute.conversation_id)

    const handleReceiveMessage = (data) => {
      try {
        const bytes = CryptoJS.AES.decrypt(data.content, SECRET_KEY)
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8)
        const decryptedMsg = { ...data, content: decryptedText || data.content }
        setMessages(prev => [...prev, decryptedMsg])
      } catch (e) {
        setMessages(prev => [...prev, data])
      }
    }

    socket.on('receive_message', handleReceiveMessage)

    return () => {
      socket.off('receive_message', handleReceiveMessage)
    }
  }, [selectedDispute, socket])

  const openChat = async (d) => {
    setSelectedDispute(d)
    try {
      const { data } = await messagingAPI.getMessages(d.conversation_id)
      if (data.success) {
        const decryptedMessages = data.data.map(m => {
          try {
            const bytes = CryptoJS.AES.decrypt(m.content, SECRET_KEY)
            const decryptedText = bytes.toString(CryptoJS.enc.Utf8)
            return { ...m, content: decryptedText || m.content }
          } catch (e) {
            return m
          }
        })
        setMessages(decryptedMessages)
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err.response?.data || err.message)
      showToast('Failed to fetch messages.', 'error')
    }
  }

  const handleSend = async () => {
    if (!newMessage.trim()) return
    setSending(true)
    const encryptedText = CryptoJS.AES.encrypt(newMessage.trim(), SECRET_KEY).toString()
    try {
      const { data } = await messagingAPI.sendMessage(selectedDispute.conversation_id, { text: encryptedText })
      if (data.success) {
        setMessages([...messages, { ...data.data, content: newMessage.trim() }])
        setNewMessage('')
      }
    } catch (err) {
      console.error('Failed to send message:', err.response?.data || err.message)
      showToast('Failed to send message.', 'error')
    } finally {
      setSending(false)
    }
  }

  const filtered = filter === 'all' ? disputes : disputes.filter(d => d.status === filter)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 24, color: '#0f172a', margin: 0, marginBottom: 4 }}>Disputes Management</h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{disputes.length} active dispute{disputes.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all','open','resolved','escalated'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 16px', borderRadius: 999, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.18s', background: filter === f ? 'linear-gradient(135deg,#093880,#1a56c4)' : '#f1f5f9', color: filter === f ? '#fff' : '#64748b' }}>
            {f} ({f === 'all' ? disputes.length : disputes.filter(d => d.status === f).length})
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #f0f4ff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', padding: 20 }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b' }}>Loading disputes...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b' }}>No disputes found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map(d => (
              <div key={d.dispute_id} onClick={() => openChat(d)} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#0f172a' }}>{d.guest_name}</h3>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: d.status === 'OPEN' ? '#fee2e2' : '#dcfce7', color: d.status === 'OPEN' ? '#ef4444' : '#15803d', textTransform: 'uppercase' }}>
                    {d.status}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#475569', margin: '0 0 8px 0' }}>{d.reason}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#94a3b8' }}>
                  <span>{d.guest_email}</span>
                  <span>{d.created_at ? new Date(d.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      <AnimatePresence>
        {selectedDispute && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              style={{ background: '#fff', borderRadius: 20, padding: 24, maxWidth: 600, width: '100%', height: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 18, color: '#0f172a', margin: 0 }}>Ticket Chat</h3>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>With {selectedDispute.guest_name} ({selectedDispute.guest_email})</p>
                </div>
                <button onClick={() => setSelectedDispute(null)} style={{ width: 34, height: 34, borderRadius: '50%', border: '1.5px solid #e5e7eb', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <FiX size={16} style={{ color: '#64748b' }} />
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16, border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, background: '#f8fafc' }}>
                {messages.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No messages yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <AnimatePresence initial={false}>
                      {messages.map(m => {
                        const isMe = !!m.sender_admin_id
                        return (
                          <motion.div key={m.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                            <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: 16, fontSize: 13, background: isMe ? '#093880' : '#fff', color: isMe ? '#fff' : '#374151', border: isMe ? 'none' : '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                              <p style={{ margin: 0 }}>{m.content}</p>
                              <span style={{ fontSize: 10, display: 'block', marginTop: 4, textAlign: 'right', color: isMe ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}>
                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Input */}
              <div style={{ display: 'flex', gap: 10 }}>
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type your reply..."
                  style={{ flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', fontSize: 13, outline: 'none', fontFamily: 'Open Sans, sans-serif' }} />
                <button onClick={handleSend} disabled={sending}
                  style={{ padding: '0 20px', borderRadius: 12, border: 'none', background: '#093880', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: sending ? 0.7 : 1 }}>
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Credit System ────────────────────────────────────────────────────────────
function CreditsSection() {
  const { adminGetAllUsers, getUserCredits, adminAdjustCredits, creditLog } = useAppData()
  const { accounts } = useAuth()
  const { showToast } = useToast()
  const [selected, setSelected] = useState(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [mode, setMode] = useState('add')

  const seedUsers = adminGetAllUsers()
  const realUsers = accounts.map(a => ({ id: a.email, name: a.name, email: a.email, role: a.role, status: 'active' }))
  const allUsers = [...seedUsers, ...realUsers.filter(r => !seedUsers.some(s => s.email === r.email))]

  const handleAdjust = () => {
    if (!selected || !amount || !reason.trim()) { showToast('Fill all fields.', 'warning'); return }
    const delta = mode === 'add' ? +amount : -Math.abs(+amount)
    adminAdjustCredits(selected.email, delta, reason, 'Admin')
    showToast(`${mode === 'add' ? 'Added' : 'Deducted'} ${Math.abs(delta)} credits for ${selected.name}.`, 'success')
    setAmount(''); setReason(''); setSelected(null)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 900, fontSize: 24, color: '#0f172a', margin: 0, marginBottom: 4 }}>Credit System</h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Manually adjust user credit balances. Credits can be applied toward bookings.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Adjust panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 style={{ fontFamily: 'Poppins,sans-serif' }} className="font-black text-gray-900 mb-4">Adjust Credits</h3>
          <div className="flex gap-2 mb-4">
            {['add','deduct'].map(m => (
              <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${mode === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{m}</button>
            ))}
          </div>
          <select value={selected?.email || ''} onChange={e => setSelected(allUsers.find(u => u.email === e.target.value) || null)}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-3 outline-none focus:border-blue-500">
            <option value="">Select user...</option>
            {allUsers.map(u => <option key={u.email} value={u.email}>{u.name} ({u.email})</option>)}
          </select>
          {selected && <p className="text-xs text-blue-600 mb-3 font-semibold">Current balance: {getUserCredits(selected.email)} credits</p>}
          <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-3 outline-none focus:border-blue-500" />
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason (e.g. Referral bonus)" className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-4 outline-none focus:border-blue-500" />
          <button onClick={handleAdjust} className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors" style={{ background: mode === 'add' ? '#16a34a' : '#dc2626' }}>
            {mode === 'add' ? '+ Add Credits' : '− Deduct Credits'}
          </button>
        </div>
        {/* User balances */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50"><p style={{ fontFamily: 'Poppins,sans-serif' }} className="font-black text-gray-900">User Balances</p></div>
          <div className="overflow-y-auto max-h-64">
            {allUsers.map((u, i) => (
              <div key={u.email} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: 'linear-gradient(135deg,#093880,#1a56c4)' }}>{u.name?.charAt(0)}</div>
                  <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                </div>
                <span className="text-sm font-black text-blue-700">{getUserCredits(u.email)} cr</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Transaction log */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50"><p style={{ fontFamily: 'Poppins,sans-serif' }} className="font-black text-gray-900">Transaction Log</p></div>
        {(!creditLog || creditLog.length === 0) ? (
          <div className="p-12 text-center"><p className="text-gray-400 font-semibold">No transactions yet</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100 bg-gray-50">{['Date','Admin','User','Amount','Reason'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">{h}</th>)}</tr></thead>
              <tbody>
                {creditLog.map((entry, i) => (
                  <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">{entry.admin}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{entry.userEmail}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-black ${entry.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>{entry.amount > 0 ? '+' : ''}{entry.amount}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{entry.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Access Control ───────────────────────────────────────────────────────────
function AccessControlSection() {
  const { adminGetAllUsers, adminChangeRole, adminSuspendUser, adminUnsuspendUser, adminRemoveUser } = useAppData()
  const { accounts } = useAuth()
  const { showToast } = useToast()
  const [suspendModal, setSuspendModal] = useState(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [suspendDuration, setSuspendDuration] = useState('7 days')

  const seedUsers = adminGetAllUsers()
  const realUsers = accounts.map(a => ({ id: a.email, name: a.name, email: a.email, role: a.role, status: 'active' }))
  const allUsers = [...seedUsers, ...realUsers.filter(r => !seedUsers.some(s => s.email === r.email))]

  const handleRoleChange = (u, newRole) => {
    adminChangeRole(u.id, newRole, 'Admin')
    showToast(`Role updated to ${newRole} for ${u.name}.`, 'success')
  }
  const confirmSuspend = () => {
    if (!suspendReason.trim()) { showToast('Please provide a reason.', 'warning'); return }
    adminSuspendUser(suspendModal.id, suspendReason, suspendDuration, 'Admin')
    showToast(`${suspendModal.name} suspended.`, 'warning')
    setSuspendModal(null); setSuspendReason('')
  }

  const statusColors = { active: '#16a34a', suspended: '#eab308', removed: '#ef4444' }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 900, fontSize: 24, color: '#0f172a', margin: 0, marginBottom: 4 }}>Access Control</h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Manage user roles, suspend accounts, and control platform access.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 bg-gray-50">{['User','Current Role','Status','Change Role','Actions'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">{h}</th>)}</tr></thead>
            <tbody>
              {allUsers.map((u, i) => (
                <motion.tr key={u.id || u.email} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg,#093880,#1a56c4)' }}>{u.name?.charAt(0)}</div>
                      <div><p className="font-semibold text-sm text-gray-900">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize bg-blue-50 text-blue-700">{u.role}</span></td>
                  <td className="px-5 py-4"><span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ color: statusColors[u.status || 'active'], background: (statusColors[u.status || 'active']) + '18' }}>{u.status || 'active'}</span></td>
                  <td className="px-5 py-4">
                    <select value={u.role} onChange={e => handleRoleChange(u, e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold text-gray-600 bg-white outline-none focus:border-blue-500">
                      {['user','vendor'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      {u.status === 'suspended' ? (
                        <button onClick={() => { adminUnsuspendUser(u.id); showToast(`${u.name} unsuspended.`, 'success') }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors"><FiCheck size={11} /> Restore</button>
                      ) : (
                        <button onClick={() => { setSuspendModal(u); setSuspendReason('') }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors"><FiLock size={11} /> Suspend</button>
                      )}
                      {u.status !== 'removed' && (
                        <button onClick={() => { adminRemoveUser(u.id, 'Admin action'); showToast(`${u.name} removed.`, 'error') }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"><FiTrash2 size={11} /> Remove</button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <AnimatePresence>
        {suspendModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: .95 }} animate={{ scale: 1 }} exit={{ scale: .95 }} className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h3 style={{ fontFamily: 'Poppins,sans-serif' }} className="text-lg font-black text-gray-900 mb-2">Suspend {suspendModal.name}?</h3>
              <textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)} rows={3} placeholder="Reason for suspension..." className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none outline-none focus:border-yellow-400 mb-3" />
              <select value={suspendDuration} onChange={e => setSuspendDuration(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-4 outline-none">
                {['24 hours','3 days','7 days','30 days','Permanent'].map(d => <option key={d}>{d}</option>)}
              </select>
              <div className="flex gap-3">
                <button onClick={() => setSuspendModal(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={confirmSuspend} className="flex-1 py-3 rounded-xl bg-yellow-500 text-white text-sm font-bold hover:bg-yellow-600">Suspend</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
function AuditLogSection() {
  const { auditLog } = useAppData()
  const actionColors = { 'KYC Approved': '#10b981', 'KYC Rejected': '#ef4444', 'Credits Added': '#3b82f6', 'Credits Deducted': '#f97316', 'Role Changed': '#8b5cf6', 'User Suspended': '#eab308', 'User Unsuspended': '#10b981', 'User Removed': '#ef4444' }
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 900, fontSize: 24, color: '#0f172a', margin: 0, marginBottom: 4 }}>Audit Log</h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{(auditLog || []).length} recorded admin actions</p>
      </div>
      {(!auditLog || auditLog.length === 0) ? (
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #f0f4ff', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><FiClock size={24} style={{ color: '#cbd5e1' }} /></div>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#94a3b8', margin: 0 }}>No admin actions recorded yet</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #f0f4ff', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1.5px solid #f1f5f9', background: '#f8fafc' }}>{['Time','Action','Target','Details'].map(h => <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>)}</tr></thead>
              <tbody>
                {auditLog.map((entry, i) => (
                  <motion.tr key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    style={{ borderBottom: '1px solid #f8fafc' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '13px 20px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{new Date(entry.timestamp).toLocaleString()}</td>
                    <td style={{ padding: '13px 20px' }}><span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, color: actionColors[entry.action] || '#6b7280', background: (actionColors[entry.action] || '#6b7280') + '18' }}>{entry.action}</span></td>
                    <td style={{ padding: '13px 20px', fontSize: 12, fontWeight: 600, color: '#374151' }}>{entry.targetEmail || '—'}</td>
                    <td style={{ padding: '13px 20px', fontSize: 12, color: '#64748b' }}>{entry.details || '—'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const { logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [section, setSection] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    pendingProperties: 0,
    totalBookingsCount: 0,
    totalReviews: 0,
    approvedProperties: 0,
    rejectedProperties: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.getDashboard()
        if (data.success) {
          setStats({
            totalUsers: data.data.total_users || 0,
            totalVendors: data.data.total_hosts || 0,
            pendingProperties: data.data.pending_kyc || 0,
            totalBookingsCount: 0,
            totalReviews: 0,
            approvedProperties: data.data.published_listings || 0,
            rejectedProperties: 0
          })
        }
      } catch (err) {
        console.error('Failed to fetch admin stats:', err)
        showToast('Failed to fetch dashboard stats.', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [showToast])

  const handleLogout = () => { logout(); navigate('/') }

  const renderSection = () => {
    switch (section) {
      case 'overview': return <OverviewSection stats={stats} />
      case 'users': return <UserManagementSection />
      case 'kyc': return <KYCQueueSection />
      case 'properties': return <PropertyVerificationSection />
      case 'disputes': return <DisputesSection />
      case 'reviews': return <AdminReviewsSection />
      case 'audit': return <AuditLogSection />
      default: return null
    }
  }

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'linear-gradient(180deg, #0a2342 0%, #0d2d5e 60%, #093880 100%)' }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
            <FiShield style={{ color: '#fff' }} size={18} />
          </div>
          <div>
            <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 17, color: '#fff', letterSpacing: '-0.3px' }}>Grihastha</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Admin Panel</p>
          </div>
        </div>
      </div>
      {/* Admin chip */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.08)' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#78350f', fontWeight: 900, fontSize: 14, flexShrink: 0, fontFamily: 'Poppins, sans-serif' }}>A</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>admin@grihastha.com</p>
          </div>
        </div>
      </div>
      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 10px 6px' }}>Navigation</p>
        {NAV.map(item => {
          const active = section === item.id
          const pendingCount = item.id === 'properties' ? stats.pendingProperties : item.id === 'kyc' ? (stats.kycPending || 0) : 0
          return (
            <motion.button key={item.id} whileTap={{ scale: 0.97 }}
              onClick={() => { setSection(item.id); setSidebarOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%', textAlign: 'left', transition: 'all 0.18s', background: active ? 'rgba(255,255,255,0.15)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.5)', fontFamily: 'Open Sans, sans-serif', boxShadow: active ? 'inset 0 0 0 1px rgba(255,255,255,0.12)' : 'none' }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' } }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.18s' }}>
                <item.icon size={14} />
              </div>
              <span style={{ flex: 1 }}>{item.label}</span>
              {pendingCount > 0 && <span style={{ background: '#f59e0b', color: '#78350f', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 999 }}>{pendingCount}</span>}
              {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa', flexShrink: 0 }} />}
            </motion.button>
          )
        })}
      </nav>
      {/* Sign out */}
      <div style={{ padding: '10px 10px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%', background: 'transparent', color: 'rgba(255,255,255,0.45)', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fca5a5' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiLogOut size={14} /></div>
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f1f5f9', fontFamily: 'Open Sans, sans-serif' }}>
      {/* Desktop Sidebar */}
      <div style={{ width: 252, flexShrink: 0, position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 24px rgba(0,0,0,0.12)' }} className="hidden md:flex">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex' }}>
            <motion.div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setSidebarOpen(false)} />
            <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: 'spring', damping: 25 }}
              style={{ position: 'relative', zIndex: 10, width: 260 }}>
              <SidebarContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1.5px solid #e2e8f0', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#0f172a', lineHeight: 1.2 }}>{NAV.find(n => n.id === section)?.label}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Admin Panel · Grihastha</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {stats.pendingProperties > 0 && (
              <span style={{ background: '#fffbeb', color: '#d97706', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999, border: '1px solid #fde68a' }}>
                ⏳ {stats.pendingProperties} pending
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '32px 28px', overflowY: 'auto', overflowX: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
