import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiHome, FiUsers, FiShield, FiActivity, FiLogOut, FiCheck, FiX, FiEye, FiTrash2, FiMenu, FiAlertCircle, FiFileText, FiRefreshCw, FiMessageSquare, FiStar } from 'react-icons/fi'
import { FaStar } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { useAppData } from '../context/AppDataContext'
import { useToast } from '../context/ToastContext'

const NAV = [
  { id: 'overview', label: 'Overview', icon: FiActivity },
  { id: 'users', label: 'User Management', icon: FiUsers },
  { id: 'properties', label: 'Property Verification', icon: FiShield },
  { id: 'reviews', label: 'Reviews', icon: FiMessageSquare },
]

function StatusBadge({ status }) {
  const map = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    active: 'bg-green-50 text-green-700 border-green-200',
    removed: 'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${map[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  )
}

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black" style={{ fontFamily: 'Poppins, sans-serif', color: '#0f172a' }}>{value}</p>
      </div>
    </motion.div>
  )
}

function OverviewSection({ stats }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-2xl font-black text-gray-900 mb-2">System Overview</h2>
      <p className="text-sm text-gray-500 mb-6">Platform health and key metrics at a glance.</p>
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <StatCard label="Active Users" value={stats.totalUsers} icon={FiUsers} color="#093880" bg="#eff6ff" />
        <StatCard label="Host Accounts" value={stats.totalVendors} icon={FiHome} color="#10b981" bg="#ecfdf5" />
        <StatCard label="Pending Review" value={stats.pendingProperties} icon={FiShield} color="#f59e0b" bg="#fffbeb" />
        <StatCard label="Total Bookings" value={stats.totalBookingsCount} icon={FiActivity} color="#6366f1" bg="#eef2ff" />
        <StatCard label="Total Reviews" value={stats.totalReviews ?? 0} icon={FiMessageSquare} color="#ec4899" bg="#fdf2f8" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-3xl font-black text-green-600 mb-1">{stats.approvedProperties}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Approved Properties</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-3xl font-black text-yellow-500 mb-1">{stats.pendingProperties}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Pending Approval</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-3xl font-black text-red-500 mb-1">{stats.rejectedProperties}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Rejected</p>
        </div>
      </div>
    </div>
  )
}

function UserManagementSection() {
  const { adminGetAllUsers, adminRemoveUser, adminRestoreUser } = useAppData()
  const { accounts } = useAuth()
  const { showToast } = useToast()
  const [removeModal, setRemoveModal] = useState(null)
  const [reason, setReason] = useState('')

  const seedUsers = adminGetAllUsers()
  // Merge with real accounts
  const realUsers = accounts.map(acc => ({
    id: acc.email,
    name: acc.name,
    email: acc.email,
    role: acc.role,
    createdAt: acc.createdAt,
    status: 'active',
  }))
  const allUsers = [
    ...seedUsers,
    ...realUsers.filter(ru => !seedUsers.some(su => su.email === ru.email)),
  ]

  const handleRemove = (user) => { setRemoveModal(user); setReason('') }
  const confirmRemove = () => {
    if (!reason.trim()) { showToast('Please provide a reason.', 'warning'); return }
    adminRemoveUser(removeModal.id, reason)
    showToast(`User "${removeModal.name}" has been removed.`, 'success')
    setRemoveModal(null)
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-2xl font-black text-gray-900 mb-2">User Management</h2>
      <p className="text-sm text-gray-500 mb-6">{allUsers.length} registered account{allUsers.length !== 1 ? 's' : ''}</p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['User', 'Role', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u, i) => (
                <motion.tr key={u.id || u.email} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #093880, #1a56c4)' }}>
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={u.role} /></td>
                  <td className="px-5 py-4 text-sm text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-4"><StatusBadge status={u.status || 'active'} /></td>
                  <td className="px-5 py-4">
                    {u.status === 'removed' ? (
                      <button onClick={() => { adminRestoreUser(u.id); showToast(`User "${u.name}" restored.`, 'success') }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors">
                        <FiRefreshCw size={11} /> Restore
                      </button>
                    ) : (
                      <button onClick={() => handleRemove(u)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                        <FiTrash2 size={11} /> Remove
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
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
  const { allHostPropertiesRaw, adminApproveProperty, adminRejectProperty } = useAppData()
  const { showToast } = useToast()
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [docPreview, setDocPreview] = useState(null)
  const [filter, setFilter] = useState('all')

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
      <h2 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-2xl font-black text-gray-900 mb-2">Property Verification</h2>
      <p className="text-sm text-gray-500 mb-5">{allHostPropertiesRaw.length} submitted propert{allHostPropertiesRaw.length !== 1 ? 'ies' : 'y'}</p>

      <div className="flex gap-2 mb-5 flex-wrap">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${filter === f ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            style={filter === f ? { background: 'linear-gradient(135deg, #093880, #1a56c4)' } : {}}>
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
                  <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                    <FiFileText size={16} /> {docPreview.legalDocName}
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full ml-auto">Uploaded ✓</span>
                  </div>
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
  const { reviews, allProperties, allHostPropertiesRaw } = useAppData()
  const { showToast } = useToast()
  const [deleteModal, setDeleteModal] = useState(null)
  const [filterProp, setFilterProp] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')

  // Build flat list of all reviews with property info
  const allProps = [...allProperties, ...allHostPropertiesRaw]
  const allReviews = Object.entries(reviews).flatMap(([propId, propReviews]) => {
    const prop = allProps.find(p => String(p.id) === String(propId))
    return (propReviews || []).map(r => ({
      ...r,
      propertyTitle: prop?.title || `Property ${propId}`,
      propertyId: propId,
      propertyImage: prop?.image,
    }))
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const totalAvg = allReviews.length > 0
    ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
    : null

  const filtered = allReviews.filter(r => {
    const propMatch = filterProp === 'all' || String(r.propertyId) === String(filterProp)
    const ratingMatch = ratingFilter === 'all' || r.rating === Number(ratingFilter)
    return propMatch && ratingMatch
  })

  // Get context to delete reviews
  const { setReviewsAdmin } = useAppData()

  const handleDelete = (review) => setDeleteModal(review)
  const confirmDelete = () => {
    setReviewsAdmin(deleteModal.propertyId, deleteModal.id)
    showToast('Review deleted successfully.', 'success')
    setDeleteModal(null)
  }

  // Unique property list for filter
  const propOptions = [...new Map(
    allReviews.map(r => [String(r.propertyId), { id: r.propertyId, title: r.propertyTitle }])
  ).values()]

  return (
    <div>
      <h2 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-2xl font-black text-gray-900 mb-2">Reviews Management</h2>
      <p className="text-sm text-gray-500 mb-5">{allReviews.length} total review{allReviews.length !== 1 ? 's' : ''} across all properties</p>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-3xl font-black text-blue-700 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>{allReviews.length}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Reviews</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-3xl font-black text-amber-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>{totalAvg || '—'}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Platform Avg Rating</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-3xl font-black text-green-600 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>{propOptions.length}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Properties w/ Reviews</p>
        </div>
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

export default function AdminDashboard() {
  const { logout } = useAuth()
  const { getAdminStats } = useAppData()
  const navigate = useNavigate()
  const [section, setSection] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const stats = getAdminStats()

  const handleLogout = () => { logout(); navigate('/') }

  const renderSection = () => {
    switch (section) {
      case 'overview': return <OverviewSection stats={stats} />
      case 'users': return <UserManagementSection />
      case 'properties': return <PropertyVerificationSection />
      case 'reviews': return <AdminReviewsSection />
      default: return null
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #093880, #1a56c4)' }}>
            <FiShield className="text-white" size={18} />
          </div>
          <div>
            <p style={{ fontFamily: 'Poppins, sans-serif' }} className="font-black text-blue-900 text-base">Grihastha</p>
            <p className="text-xs text-gray-400 font-semibold">Admin Panel</p>
          </div>
        </div>
      </div>
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm" style={{ background: 'linear-gradient(135deg, #093880, #1a56c4)' }}>A</div>
          <div>
            <p className="font-bold text-sm text-gray-900">Administrator</p>
            <p className="text-xs text-gray-400">admin@grihastha.com</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 flex flex-col gap-1">
        {NAV.map(item => {
          const active = section === item.id
          return (
            <motion.button key={item.id} whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setSection(item.id); setSidebarOpen(false) }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all ${active ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              style={active ? { background: 'linear-gradient(135deg, #093880, #1a56c4)' } : {}}>
              <item.icon size={16} />
              {item.label}
              {item.id === 'properties' && stats.pendingProperties > 0 && (
                <span className="ml-auto bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-0.5 rounded-full">{stats.pendingProperties}</span>
              )}
            </motion.button>
          )
        })}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <button onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
          <FiLogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-gray-50" style={{ fontFamily: 'Open Sans, sans-serif' }}>
      {/* Desktop Sidebar */}
      <div className="w-60 bg-white border-r border-gray-100 flex-shrink-0 hidden md:flex flex-col sticky top-0 h-screen">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex md:hidden">
            <motion.div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: 'spring', damping: 25 }}
              className="relative z-10 w-64 bg-white h-full">
              <SidebarContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <div className="bg-white/95 backdrop-blur border-b border-gray-100 px-6 h-16 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(o => !o)} className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50">
              <FiMenu size={18} className="text-gray-600" />
            </button>
            <p style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-gray-900 text-sm">
              {NAV.find(n => n.id === section)?.label}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {stats.pendingProperties > 0 && (
              <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
                {stats.pendingProperties} pending review
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
