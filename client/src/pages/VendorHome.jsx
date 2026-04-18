import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FiHome, FiPlus, FiList, FiCalendar, FiUser, FiLogOut,
  FiMenu, FiX, FiEdit2, FiTrash2, FiEye, FiCheck, FiClock, FiTrendingUp,
  FiDollarSign, FiAlertCircle, FiUpload, FiStar, FiBell,
} from 'react-icons/fi'
import { FaStar } from 'react-icons/fa'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useAppData } from '../context/AppDataContext'
import { useToast } from '../context/ToastContext'

// ──────────────────────────────────────────────────
// Sidebar config
// ──────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome },
  { id: 'add', label: 'Add Property', icon: FiPlus },
  { id: 'listings', label: 'My Listings', icon: FiList },
  { id: 'bookings', label: 'Bookings', icon: FiCalendar },
  { id: 'profile', label: 'Profile', icon: FiUser },
]

const ALL_AMENITIES = [
  'WiFi', 'Air Conditioning', 'Parking', 'Kitchen', 'Washing Machine',
  'TV', 'Pool', 'Gym', 'Garden', 'Balcony', 'Hot Water', 'Power Backup',
]
const CATEGORIES = [
  { label: 'House', id: 'house' },
  { label: 'Room', id: 'room' },
  { label: 'Apartment', id: 'apartment' },
  { label: 'Building', id: 'building' },
]

// ──────────────────────────────────────────────────
// Revenue BarChart using Recharts
// ──────────────────────────────────────────────────
function RevenueChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 4 }} barSize={22}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          formatter={(v) => [`Rs. ${Number(v).toLocaleString()}`, 'Revenue']}
          labelStyle={{ fontWeight: 700, color: '#111827' }}
        />
        <Bar dataKey="revenue" fill="#093880" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Bookings AreaChart
function BookingsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="bookingsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          formatter={(v) => [v, 'Bookings']}
          labelStyle={{ fontWeight: 700, color: '#111827' }}
        />
        <Area type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2.5} fill="url(#bookingsGrad)" dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ──────────────────────────────────────────────────
// Stat card
// ──────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <motion.div whileHover={{ y: -4 }}
      style={{ background: '#fff', borderRadius: 20, padding: '22px 24px', boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1.5px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</p>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 24, color: '#0f172a', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{sub}</p>}
      </div>
    </motion.div>
  )
}

// ──────────────────────────────────────────────────
// SECTION: Overview dashboard (API-driven)
// ──────────────────────────────────────────────────
function DashboardOverview({ user, setSection }) {
  const { getHostEarnings, getMyListings, getHostBookings, fetchNotifications } = useAppData()
  const [stats, setStats] = useState({ totalListings: 0, totalBookings: 0, totalEarnings: 0, occupancyRate: 0 })
  const [monthlyData, setMonthlyData] = useState([])
  const [topProperty, setTopProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recentNotif, setRecentNotif] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [listingsRes, bookingsRes, earningsRes, notifRes] = await Promise.all([
          getMyListings(),
          getHostBookings(),
          getHostEarnings(),
          fetchNotifications(true)
        ])

        const listings = listingsRes.ok ? (listingsRes.data?.listings || listingsRes.data || []) : []
        const bookings = bookingsRes.ok ? (bookingsRes.data || []) : []
        const earnings = earningsRes.ok ? (earningsRes.data || {}) : {}
        const notifs = notifRes.success ? (notifRes.data || []) : []

        // Compute total earnings from bookings directly
        const paidBookings = bookings.filter(b => b.payment_status === 'paid')
        const computedEarnings = paidBookings.reduce((sum, b) => {
          const pb = typeof b.price_breakdown === 'string' ? JSON.parse(b.price_breakdown) : (b.price_breakdown || {})
          return sum + Number(b.total_price || pb.total || 0)
        }, 0)

        setStats({
          totalListings: listings.length || 0,
          totalBookings: bookings.length || 0,
          totalEarnings: earnings.total_earnings || computedEarnings || 0,
          occupancyRate: earnings.occupancy_rate || 0,
        })

        if (notifs.length > 0) {
          const latest = notifs.find(n => n.type === 'new_booking' || n.type === 'booking')
          if (latest) setRecentNotif(latest)
        }

        // Build monthly data from actual bookings (bulletproof)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const currentMonth = new Date().getMonth() // 0-indexed
        const revenueByMonth = {}
        const countByMonth = {}

        bookings.forEach(b => {
          const d = new Date(b.created_at)
          if (d.getFullYear() === new Date().getFullYear()) {
            const m = d.getMonth()
            countByMonth[m] = (countByMonth[m] || 0) + 1
            if (b.payment_status === 'paid') {
              const pb = typeof b.price_breakdown === 'string' ? JSON.parse(b.price_breakdown) : (b.price_breakdown || {})
              revenueByMonth[m] = (revenueByMonth[m] || 0) + Number(b.total_price || pb.total || 0)
            }
          }
        })

        // Use earnings API data if it has it, otherwise use computed data
        if (earnings.monthly_data && earnings.monthly_data.some(d => d.revenue > 0 || d.bookings > 0)) {
          setMonthlyData(earnings.monthly_data.map(d => ({
            label: d.label,
            revenue: Number(d.revenue) || 0,
            bookings: Number(d.bookings) || 0,
          })))
        } else {
          const computed = []
          for (let m = 0; m <= currentMonth; m++) {
            computed.push({
              label: monthNames[m],
              revenue: revenueByMonth[m] || 0,
              bookings: countByMonth[m] || 0,
            })
          }
          setMonthlyData(computed)
        }

        // Top property
        if (listings.length > 0) {
          setTopProperty(listings[0])
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [getMyListings, getHostBookings, getHostEarnings, fetchNotifications])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#093880', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 26, color: '#0f172a', marginBottom: 4 }}>
          Welcome back, {user?.name?.split(' ')[0]}
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14 }}>Here's how your properties are performing.</p>
      </div>

      {/* Notification Bar */}
      <AnimatePresence>
        {recentNotif && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ 
              background: 'linear-gradient(90deg, #ecfdf5 0%, #fff 100%)', 
              borderLeft: '4px solid #10b981', 
              borderRadius: 14, 
              padding: '16px 20px', 
              marginBottom: 24, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 14, 
              boxShadow: '0 4px 12px rgba(16,185,129,0.08)',
              cursor: 'pointer'
            }}
            onClick={() => { setSection('bookings'); setRecentNotif(null) }}
          >
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <FiBell size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, fontSize: 14, color: '#064e3b', marginBottom: 2 }}>{recentNotif.title}</p>
              <p style={{ fontSize: 13, color: '#065f46' }}>{recentNotif.message}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setRecentNotif(null) }} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
               <FiX size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat cards */}
      <div className="vendor-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={FiHome} label="Total Listings" value={stats.totalListings} sub="Active properties" color="#093880" bg="#eff6ff" />
        <StatCard icon={FiCalendar} label="Total Bookings" value={stats.totalBookings} sub="All bookings" color="#10b981" bg="#ecfdf5" />
        <StatCard icon={FiTrendingUp} label="Total Earnings" value={`Rs. ${Number(stats.totalEarnings).toLocaleString()}`} sub="Paid revenue" color="#f59e0b" bg="#fffbeb" />
        <StatCard icon={FiCheck} label="Occupancy Rate" value={`${stats.occupancyRate}%`} sub="Booked vs available" color="#6366f1" bg="#eef2ff" />
      </div>

      {/* Charts area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1.5px solid #f0f0f0' }}>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 20 }}>Monthly Revenue (Rs.)</h3>
          <RevenueChart data={monthlyData} />
        </div>
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1.5px solid #f0f0f0' }}>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 20 }}>Bookings per Month</h3>
          <BookingsChart data={monthlyData} />
        </div>
      </div>

      {/* Insights row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'stretch' }}>
        {topProperty ? (
          <div style={{ background: 'linear-gradient(135deg, #093880, #1a56c4)', borderRadius: 20, padding: '24px', color: '#fff', height: '100%' }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.85, marginBottom: 8 }}>
              <FiStar size={12} /> Top Property
            </p>
            <h4 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{topProperty.title}</h4>
            <p style={{ fontSize: 12, opacity: 0.75, marginBottom: 12 }}>{topProperty.address?.city || topProperty.location || ''}</p>
            <p style={{ fontSize: 13, fontWeight: 700 }}>NPR {Number(topProperty.price_per_night || topProperty.price || 0).toLocaleString()} / night</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1.5px solid #f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%' }}>
            <div style={{ marginBottom: 8 }}><FiHome size={36} style={{ color: '#9ca3af' }} /></div>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>No properties listed yet</p>
            <p style={{ fontSize: 12, color: '#6b7280' }}>Add a property to see insights</p>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1.5px solid #f0f0f0', boxShadow: '0 2px 20px rgba(0,0,0,0.06)', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', marginBottom: 12 }}>Quick Actions</p>
          {[
            { label: '+ Add New Property', action: () => setSection('add'), style: { background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff' } },
            { label: 'View All Bookings', action: () => setSection('bookings'), style: { background: '#f9fafb', color: '#374151', border: '1.5px solid #e5e7eb' } },
          ].map((btn, i) => (
            <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={btn.action}
              style={{ display: 'block', width: '100%', padding: '12px', borderRadius: 12, border: btn.style.border || 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: i === 1 ? 0 : 10, fontFamily: "'Poppins', sans-serif", ...btn.style }}>
              {btn.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────
// SECTION: Add Property (API-driven)
// ──────────────────────────────────────────────────
function AddPropertyForm({ user, onSuccess }) {
  const { createListing, updateListing, uploadPhotos, publishListing } = useAppData()
  const { showToast } = useToast()
  const [form, setForm] = useState({
    title: '', description: '', price: '', category: 'apartment',
    location: '', city: '', province: 'Bagmati', amenities: [], maxGuests: 2, bedrooms: 1, bathrooms: 1,
  })
  const [photoFiles, setPhotoFiles] = useState([])
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)

  const patch = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))
  const toggleAmenity = (a) => setForm(f => ({
    ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
  }))

  const handlePhotoChange = (e) => {
    if (e.target.files) {
      setPhotoFiles(Array.from(e.target.files).slice(0, 10))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.price || !form.location) {
      setMsg({ type: 'error', text: 'Please fill Title, Price and Location.' })
      return
    }
    setSubmitting(true)
    setMsg({ type: '', text: '' })

    try {
      // Step 1: Create draft listing
      const createRes = await createListing()
      if (!createRes.ok) throw new Error(createRes.error || 'Failed to create listing')

      const listingId = createRes.data?.listing_id || createRes.data?.id
      if (!listingId) throw new Error('No listing ID returned')

      // Step 2: Update listing details
      const updateRes = await updateListing(listingId, {
        title: form.title,
        description: form.description,
        category: form.category,
        address: {
          street: form.location,
          city: form.city || form.location.split(',')[0]?.trim() || '',
          province: form.province || 'Bagmati',
          country: 'Nepal',
        },
        floor_plan: {
          guests: +form.maxGuests,
          bedrooms: +form.bedrooms,
          bathrooms: +form.bathrooms,
          beds: +form.bedrooms,
        },
        amenities: form.amenities,
        price_per_night: +form.price,
      })
      if (!updateRes.ok) throw new Error(updateRes.error || 'Failed to update listing')

      // Step 3: Upload photos if any
      if (photoFiles.length > 0) {
        const photoRes = await uploadPhotos(listingId, photoFiles)
        if (!photoRes.ok) {
          showToast('Listing created but photo upload failed. You can add photos later.', 'warning')
        }
      }

      // Step 4: Publish
      const pubRes = await publishListing(listingId)
      if (!pubRes.ok) {
        setMsg({ type: 'success', text: 'Listing saved as draft! Publish it from My Listings when ready.' })
      } else {
        setMsg({ type: 'success', text: 'Property listed successfully! It is now visible to guests.' })
      }

      showToast('Property created! Guests can now find it.', 'success')
      setForm({ title: '', description: '', price: '', category: 'apartment', location: '', city: '', province: 'Bagmati', amenities: [], maxGuests: 2, bedrooms: 1, bathrooms: 1 })
      setPhotoFiles([])
      setTimeout(() => onSuccess?.(), 1500)
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111827', background: '#fafafa', outline: 'none', fontFamily: "'Open Sans', sans-serif", boxSizing: 'border-box' }

  return (
    <div>
      <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 24, color: '#0f172a', marginBottom: 6 }}>Add New Property</h2>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28 }}>Fill in the details to list your property for guests.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Property Title *</label>
            <input id="prop-title" placeholder="e.g. Cozy Apartment in Thamel" value={form.title} onChange={patch('title')} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#093880'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Category</label>
            <select id="prop-category" value={form.category} onChange={patch('category')} style={{ ...inputStyle }}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Price (NPR / night) *</label>
            <input id="prop-price" type="number" placeholder="e.g. 3500" value={form.price} onChange={patch('price')} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#093880'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Location *</label>
            <input id="prop-location" placeholder="e.g. Thamel, Kathmandu" value={form.location} onChange={patch('location')} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#093880'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Description</label>
            <textarea id="prop-description" placeholder="Describe your property..." value={form.description} onChange={patch('description')} rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = '#093880'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Max Guests</label>
            <input id="prop-guests" type="number" min="1" max="20" value={form.maxGuests} onChange={patch('maxGuests')} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Bedrooms</label>
            <input id="prop-bedrooms" type="number" min="0" max="20" value={form.bedrooms} onChange={patch('bedrooms')} style={inputStyle} />
          </div>
        </div>

        {/* Photo upload */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 10 }}>Property Photos</label>
          <div style={{ border: '2px dashed #e5e7eb', borderRadius: 16, padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}
            onClick={() => document.getElementById('photo-upload')?.click()}>
            <FiUpload size={24} style={{ color: '#9ca3af', marginBottom: 8 }} />
            <p style={{ fontSize: 13, color: '#6b7280' }}>Click to upload photos (max 10)</p>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>JPG, PNG · Max 5MB each</p>
            <input id="photo-upload" type="file" multiple accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
          </div>
          {photoFiles.length > 0 && (
            <p style={{ fontSize: 12, color: '#16a34a', marginTop: 8, fontWeight: 600 }}>
              {photoFiles.length} photo{photoFiles.length > 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Amenities */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 10 }}>Amenities</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALL_AMENITIES.map(a => {
              const sel = form.amenities.includes(a)
              return (
                <button key={a} type="button" onClick={() => toggleAmenity(a)}
                  style={{ padding: '7px 14px', borderRadius: 999, border: `1.5px solid ${sel ? '#093880' : '#e5e7eb'}`, background: sel ? '#eff6ff' : '#fff', color: sel ? '#093880' : '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {a}
                </button>
              )
            })}
          </div>
        </div>

        {msg.text && (
          <div style={{ background: msg.type === 'error' ? '#fef2f2' : '#ecfdf5', border: `1px solid ${msg.type === 'error' ? '#fecaca' : '#86efac'}`, borderRadius: 10, padding: '12px 16px', color: msg.type === 'error' ? '#dc2626' : '#15803d', fontSize: 13, marginBottom: 16 }}>
            {msg.text}
          </div>
        )}

        <motion.button id="submit-property-btn" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={submitting}
          style={{ padding: '14px 36px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(9,56,128,0.3)', fontFamily: "'Poppins', sans-serif", opacity: submitting ? 0.8 : 1 }}>
          {submitting ? 'Submitting...' : 'List Property'}
        </motion.button>
      </form>
    </div>
  )
}

// ──────────────────────────────────────────────────
// SECTION: My Listings (API-driven)
// ──────────────────────────────────────────────────
function MyListings({ user, setSection }) {
  const { getMyListings, deleteListing, updateListing } = useAppData()
  const { showToast } = useToast()
  const [props, setProps] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [confirm, setConfirm] = useState(null)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    const res = await getMyListings()
    if (res.ok) {
      setProps(res.data?.listings || res.data || [])
    }
    setLoading(false)
  }, [getMyListings])

  useEffect(() => { fetchListings() }, [fetchListings])

  const startEdit = (p) => { setEditingId(p.id); setEditForm({ title: p.title, price_per_night: p.price_per_night, location: p.address?.city || '' }) }
  const saveEdit = async () => {
    await updateListing(editingId, {
      title: editForm.title,
      price_per_night: +editForm.price_per_night,
      address: { city: editForm.location },
    })
    setEditingId(null)
    showToast('Property updated successfully.', 'success')
    fetchListings()
  }

  const handleDelete = async (id) => {
    await deleteListing(id)
    setConfirm(null)
    showToast('Property deleted.', 'warning')
    fetchListings()
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#093880', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 24, color: '#0f172a', margin: 0 }}>My Listings</h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{props.length} propert{props.length !== 1 ? 'ies' : 'y'} listed</p>
        </div>
        <motion.button id="add-listing-btn" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setSection('add')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <FiPlus size={15} /> Add Property
        </motion.button>
      </div>

      {props.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ marginBottom: 16 }}><FiHome size={52} style={{ color: '#9ca3af' }} /></div>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 20, color: '#111827', marginBottom: 8 }}>No properties yet</h3>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>List your first property to start earning!</p>
          <button onClick={() => setSection('add')} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            + Add Property
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {props.map((p, i) => {
            const image = p.photos?.[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&q=80'
            const title = p.title || 'Untitled'
            const location = p.address?.city || ''
            const price = p.price_per_night || 0
            const guests = p.floor_plan?.guests || 0
            const beds = p.floor_plan?.bedrooms || 0

            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f0f0f0', padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <img src={image} alt={title} style={{ width: 100, height: 80, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingId === p.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                        style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #093880', fontSize: 13, outline: 'none' }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input placeholder="Location" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }} />
                        <input placeholder="Price" type="number" value={editForm.price_per_night} onChange={e => setEditForm(f => ({ ...f, price_per_night: +e.target.value }))}
                          style={{ width: 100, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={saveEdit} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#093880', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Save</button>
                        <button onClick={() => setEditingId(null)} style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 4 }}>{title}</h3>
                      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{location} · <span style={{ textTransform: 'capitalize' }}>{p.category}</span></p>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#093880' }}>NPR {Number(price).toLocaleString()}/night</span>
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>{beds} bed · {guests} guests</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ background: p.status?.toLowerCase() === 'published' ? '#ecfdf5' : '#fffbeb', color: p.status?.toLowerCase() === 'published' ? '#16a34a' : '#d97706', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, textTransform: 'capitalize' }}>
                          {p.status || 'Draft'}
                        </span>
                        <button onClick={() => startEdit(p)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>
                          <FiEdit2 size={12} /> Edit
                        </button>
                        <button onClick={() => setConfirm(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 10, border: '1.5px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#dc2626' }}>
                          <FiTrash2 size={12} /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Confirm delete */}
      <AnimatePresence>
        {confirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              style={{ background: '#fff', borderRadius: 20, padding: '32px', maxWidth: 380, width: '100%', textAlign: 'center' }}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><FiAlertCircle size={42} style={{ color: '#dc2626' }} /></div>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, color: '#0f172a', marginBottom: 8 }}>Delete Property?</h3>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => setConfirm(null)} style={{ padding: '11px 24px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Cancel</button>
                <button onClick={() => handleDelete(confirm)}
                  style={{ padding: '11px 24px', borderRadius: 12, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ──────────────────────────────────────────────────
// SECTION: Host Bookings (API-driven)
// ──────────────────────────────────────────────────
function HostBookingsSection({ user }) {
  const { getHostBookings, acceptBooking, declineBooking } = useAppData()
  const { showToast } = useToast()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const res = await getHostBookings()
    if (res.ok) setBookings(res.data || [])
    setLoading(false)
  }, [getHostBookings])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const handleAccept = async (id) => {
    const res = await acceptBooking(id)
    if (res.ok) { showToast('Booking accepted!', 'success'); fetchBookings() }
    else showToast(res.error || 'Failed to accept', 'error')
  }

  const handleDecline = async (id) => {
    const res = await declineBooking(id)
    if (res.ok) { showToast('Booking declined.', 'warning'); fetchBookings() }
    else showToast(res.error || 'Failed to decline', 'error')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#093880', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  const confirmed = bookings.filter(b => b.status?.toLowerCase() === 'confirmed')
  const pending = bookings.filter(b => b.status?.toLowerCase() === 'pending')
  const cancelled = bookings.filter(b => b.status?.toLowerCase() === 'cancelled')

  return (
    <div>
      <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 24, color: '#0f172a', marginBottom: 6 }}>Bookings</h2>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>{confirmed.length} confirmed · {pending.length} pending · {cancelled.length} cancelled</p>

      {bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ marginBottom: 16 }}><FiCalendar size={52} style={{ color: '#9ca3af' }} /></div>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 20, color: '#111827', marginBottom: 8 }}>No bookings yet</h3>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Bookings from guests will appear here once they book your properties.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bookings.map((b, i) => {
            const image = b.listing_photo || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&q=80'
            const title = b.listing_title || 'Property'
            const guestName = b.guest_name || 'Guest'
            const isPaid = b.payment_status === 'paid'
            const status = b.status?.toLowerCase()
            const pb = typeof b.price_breakdown === 'string' ? JSON.parse(b.price_breakdown) : (b.price_breakdown || {})
            const totalPrice = Number(b.total_price || pb.total || 0)
            const nights = b.nights || 0
            const numGuests = b.num_guests || 1
            const pricePerNight = Number(b.price_per_night || pb.base_price / nights || 0)

            return (
              <motion.div key={b.id || b.booking_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0f0f0', padding: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                
                {/* Top row: image + details + status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <img src={image} alt="" style={{ width: 72, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
                      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>
                        Booked by <strong style={{ color: '#374151' }}>{guestName}</strong>
                      </p>
                    </div>
                  </div>
                  
                  <span style={{ 
                    background: status === 'confirmed' ? '#ecfdf5' : status === 'pending' ? '#fffbeb' : '#fef2f2', 
                    color: status === 'confirmed' ? '#16a34a' : status === 'pending' ? '#d97706' : '#dc2626', 
                    fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999, flexShrink: 0,
                    textTransform: 'capitalize'
                  }}>
                    {status === 'confirmed' && isPaid ? '✓ Auto-Confirmed' : b.status}
                  </span>
                </div>

                {/* Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, background: '#f9fafb', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
                  <div>
                    <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Check-in</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{b.check_in ? new Date(b.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Check-out</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{b.check_out ? new Date(b.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Duration</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{nights} night{nights !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Guests</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{numGuests} guest{numGuests !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Price row + actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, color: '#093880' }}>
                      NPR {totalPrice.toLocaleString()}
                    </p>
                    <p style={{ fontSize: 11, color: '#6b7280' }}>
                      NPR {pricePerNight.toLocaleString()} × {nights} night{nights !== 1 ? 's' : ''}
                      {pb.cleaning_fee ? ` + NPR ${Number(pb.cleaning_fee).toLocaleString()} cleaning` : ''}
                    </p>
                    {isPaid && (
                      <p style={{ fontSize: 10, color: '#16a34a', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>
                        ✓ Payment Received
                      </p>
                    )}
                  </div>

                  {status === 'pending' && !isPaid && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleAccept(b.id || b.booking_id)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Accept</button>
                      <button onClick={() => handleDecline(b.id || b.booking_id)} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Decline</button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────
// SECTION: Profile (API-driven)
// ──────────────────────────────────────────────────
function ProfileSection({ user, onLogout }) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 24, color: '#0f172a', marginBottom: 28 }}>Profile</h2>
      <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1.5px solid #f0f0f0', overflow: 'hidden', maxWidth: 500 }}>
        <div style={{ background: 'linear-gradient(135deg, #093880, #1a56c4)', padding: '32px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#093880', fontWeight: 900, fontSize: 28, fontFamily: "'Poppins', sans-serif" }}>
            {user?.avatar}
          </div>
          <div style={{ color: '#fff' }}>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 20, marginBottom: 4 }}>{user?.name}</h3>
            <p style={{ opacity: 0.75, fontSize: 14 }}>{user?.email}</p>
            <span style={{ background: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, marginTop: 8, display: 'inline-block' }}>Host Account</span>
          </div>
        </div>
        <div style={{ padding: '24px 28px' }}>
          {[
            { label: 'Full Name', value: user?.name },
            { label: 'Email', value: user?.email },
            { label: 'Account Type', value: 'Host (Vendor)' },
          ].map(item => (
            <div key={item.label} style={{ padding: '14px 0', borderBottom: '1px solid #f0f0f0' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{item.value}</p>
            </div>
          ))}
          <motion.button id="profile-logout-btn" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, padding: '12px 24px', borderRadius: 14, border: 'none', background: '#fef2f2', color: '#dc2626', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            <FiLogOut size={16} /> Sign Out
          </motion.button>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────
// MAIN VendorHome component
// ──────────────────────────────────────────────────
export default function VendorHome() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [section, setSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const renderSection = () => {
    switch (section) {
      case 'dashboard': return <DashboardOverview user={user} setSection={setSection} />
      case 'add': return <AddPropertyForm user={user} onSuccess={() => setSection('listings')} />
      case 'listings': return <MyListings user={user} setSection={setSection} />
      case 'bookings': return <HostBookingsSection user={user} />
      case 'profile': return <ProfileSection user={user} onLogout={handleLogout} />
      default: return null
    }
  }

  const Sidebar = ({ isMobile = false }) => (
    <div style={{
      width: isMobile ? '100%' : 240,
      background: '#fff',
      borderRight: isMobile ? 'none' : '1.5px solid #f0f0f0',
      display: 'flex',
      flexDirection: 'column',
      height: isMobile ? 'auto' : '100vh',
      position: isMobile ? 'relative' : 'sticky',
      top: 0,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 24px', borderBottom: '1.5px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #093880, #1a56c4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiHome style={{ color: '#fff' }} size={18} />
          </div>
          <div>
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 16, color: '#093880' }}>Grihastha</span>
            <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Host Portal</p>
          </div>
        </div>
      </div>

      {/* User chip */}
      <div style={{ padding: '16px 20px', borderBottom: '1.5px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: '#f9fafb' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #093880, #1a56c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
            {user?.avatar}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
            <p style={{ fontSize: 11, color: '#9ca3af' }}>Host</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const active = section === item.id
          return (
            <motion.button key={item.id} id={`nav-${item.id}`}
              whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setSection(item.id); setSidebarOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%', textAlign: 'left', transition: 'all 0.2s',
                background: active ? 'linear-gradient(135deg, #093880, #1a56c4)' : 'transparent',
                color: active ? '#fff' : '#6b7280',
                fontFamily: "'Open Sans', sans-serif",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f3f4f6' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <item.icon size={16} />
              {item.label}
              {item.id === 'add' && (
                <span style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: active ? 'rgba(255,255,255,0.3)' : '#093880', color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>+</span>
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 12px', borderTop: '1.5px solid #f0f0f0' }}>
        <button onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%', background: 'transparent', color: '#9ca3af', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}>
          <FiLogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f9fafb', fontFamily: "'Open Sans', sans-serif" }}>
      {/* Desktop sidebar */}
      <div style={{ display: 'flex' }} className="desktop-sidebar">
        <Sidebar />
      </div>

      {/* Mobile overlay sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
              onClick={() => setSidebarOpen(false)} />
            <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: 'spring', damping: 25 }}
              style={{ position: 'relative', zIndex: 10, width: 260 }}>
              <Sidebar isMobile />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="vendor-main-content" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', maxWidth: '100%', overflowX: 'hidden' }}>
        {/* Top bar */}
        <div className="vendor-top-bar" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1.5px solid #f0f0f0', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>
              <FiMenu size={18} style={{ color: '#374151' }} />
            </button>
            <div>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                {NAV_ITEMS.find(n => n.id === section)?.label}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => navigate('/home')}
              style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>
              Browse as Guest
            </motion.button>
          </div>
        </div>

        {/* Page content */}
        <div className="vendor-page-content" style={{ flex: 1, padding: '32px', overflowY: 'auto', overflowX: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} style={{ width: '100%', maxWidth: '100%' }}>
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .vendor-stats-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        @media (max-width: 1200px) {
          .vendor-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .vendor-stats-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .vendor-page-content {
            padding: 16px !important;
          }

          .vendor-top-bar {
            padding: 0 16px !important;
          }
        }

        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }

          .vendor-page-content {
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  )
}
