import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FiHome, FiPlus, FiList, FiCalendar, FiBarChart2, FiUser, FiLogOut,
  FiMenu, FiX, FiEdit2, FiTrash2, FiEye, FiCheck, FiClock, FiTrendingUp,
  FiDollarSign, FiAlertCircle, FiUpload, FiStar,
} from 'react-icons/fi'
import { FaStar } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { useAppData } from '../context/AppDataContext'

// ──────────────────────────────────────────────────
// Sidebar config
// ──────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome },
  { id: 'add', label: 'Add Property', icon: FiPlus },
  { id: 'listings', label: 'My Listings', icon: FiList },
  { id: 'bookings', label: 'Bookings', icon: FiCalendar },
  { id: 'analytics', label: 'Analytics', icon: FiBarChart2 },
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
const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
  'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80',
]

// ──────────────────────────────────────────────────
// Mini bar/line chart using SVG
// ──────────────────────────────────────────────────
function BarChart({ data, field, color = '#093880', label }) {
  const max = Math.max(...data.map(d => d[field]), 1)
  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <motion.div
              initial={{ height: 0 }} animate={{ height: `${(d[field] / max) * 80}px` }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
              style={{ width: '100%', background: `linear-gradient(180deg, ${color}, ${color}88)`, borderRadius: '6px 6px 0 0', minHeight: 4 }}
            />
            <span style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center' }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
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
// SECTION: Overview dashboard
// ──────────────────────────────────────────────────
function DashboardOverview({ user, analytics, setSection }) {
  const { totalListings, totalBookings, totalEarnings, occupancyRate, monthlyData, topProperty } = analytics

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 26, color: '#0f172a', marginBottom: 4 }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14 }}>Here's how your properties are performing.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={FiHome} label="Total Listings" value={totalListings} sub="Active properties" color="#093880" bg="#eff6ff" />
        <StatCard icon={FiCalendar} label="Total Bookings" value={totalBookings} sub="Confirmed stays" color="#10b981" bg="#ecfdf5" />
        <StatCard icon={FiDollarSign} label="Total Earnings" value={`NPR ${totalEarnings.toLocaleString()}`} sub="All-time revenue" color="#f59e0b" bg="#fffbeb" />
        <StatCard icon={FiTrendingUp} label="Occupancy Rate" value={`${occupancyRate}%`} sub="Booked vs available" color="#6366f1" bg="#eef2ff" />
      </div>

      {/* Charts area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1.5px solid #f0f0f0' }}>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 20 }}>Monthly Revenue (NPR)</h3>
          <BarChart data={monthlyData} field="revenue" color="#093880" label="Revenue per month" />
        </div>
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1.5px solid #f0f0f0' }}>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 20 }}>Bookings per Month</h3>
          <BarChart data={monthlyData} field="bookings" color="#10b981" label="Bookings per month" />
        </div>
      </div>

      {/* Insights row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {topProperty ? (
          <div style={{ background: 'linear-gradient(135deg, #093880, #1a56c4)', borderRadius: 20, padding: '24px', color: '#fff' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.7, marginBottom: 8 }}>🏆 Top Performer</p>
            <h4 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{topProperty.title}</h4>
            <p style={{ fontSize: 12, opacity: 0.75, marginBottom: 12 }}>{topProperty.location}</p>
            <p style={{ fontSize: 13, fontWeight: 700 }}>NPR {topProperty.price?.toLocaleString()} / night</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1.5px solid #f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏠</div>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>No top performer yet</p>
            <p style={{ fontSize: 12, color: '#6b7280' }}>Add properties to see insights</p>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1.5px solid #f0f0f0', boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', marginBottom: 12 }}>Quick Actions</p>
          {[
            { label: '+ Add New Property', action: () => setSection('add'), style: { background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff' } },
            { label: '📋 View All Bookings', action: () => setSection('bookings'), style: { background: '#f9fafb', color: '#374151', border: '1.5px solid #e5e7eb' } },
          ].map((btn, i) => (
            <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={btn.action}
              style={{ display: 'block', width: '100%', padding: '12px', borderRadius: 12, border: btn.style.border || 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 10, fontFamily: "'Poppins', sans-serif", ...btn.style }}>
              {btn.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────
// SECTION: Add Property
// ──────────────────────────────────────────────────
function AddPropertyForm({ user, onSuccess }) {
  const { addHostProperty } = useAppData()
  const [form, setForm] = useState({
    title: '', description: '', price: '', category: 'apartment',
    location: '', amenities: [], maxGuests: 2, bedrooms: 1, bathrooms: 1,
    image: SAMPLE_IMAGES[0], images: [SAMPLE_IMAGES[0]],
  })
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)

  const patch = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))
  const toggleAmenity = (a) => setForm(f => ({
    ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.price || !form.location) {
      setMsg({ type: 'error', text: 'Please fill Title, Price and Location.' })
      return
    }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 700))
    const result = addHostProperty({ ...form, price: +form.price, maxGuests: +form.maxGuests, bedrooms: +form.bedrooms, bathrooms: +form.bathrooms }, user.email, user.name)
    setSubmitting(false)
    if (result.ok) {
      setMsg({ type: 'success', text: 'Property listed successfully! It is now visible to guests.' })
      setForm({ title: '', description: '', price: '', category: 'apartment', location: '', amenities: [], maxGuests: 2, bedrooms: 1, bathrooms: 1, image: SAMPLE_IMAGES[0], images: [SAMPLE_IMAGES[0]] })
      setTimeout(() => onSuccess?.(), 1500)
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

        {/* Image picker */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 10 }}>Property Image</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {SAMPLE_IMAGES.map(img => (
              <div key={img} onClick={() => setForm(f => ({ ...f, image: img, images: [img] }))}
                style={{ aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: `2.5px solid ${form.image === img ? '#093880' : 'transparent'}`, transition: 'all 0.2s' }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>Select a sample image (in production, upload your own)</p>
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
          {submitting ? '⏳ Submitting...' : '🏠 List Property'}
        </motion.button>
      </form>
    </div>
  )
}

// ──────────────────────────────────────────────────
// SECTION: My Listings
// ──────────────────────────────────────────────────
function MyListings({ user, setSection }) {
  const { getHostProperties, deleteHostProperty, updateHostProperty } = useAppData()
  const props = getHostProperties(user.email)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [confirm, setConfirm] = useState(null)

  const startEdit = (p) => { setEditingId(p.id); setEditForm({ title: p.title, price: p.price, location: p.location }) }
  const saveEdit = () => { updateHostProperty(editingId, editForm); setEditingId(null) }

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
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏠</div>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 20, color: '#111827', marginBottom: 8 }}>No properties yet</h3>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>List your first property to start earning!</p>
          <button onClick={() => setSection('add')} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            + Add Property
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {props.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f0f0f0', padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <img src={p.image} alt={p.title} style={{ width: 100, height: 80, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingId === p.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                      style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #093880', fontSize: 13, outline: 'none' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input placeholder="Location" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }} />
                      <input placeholder="Price" type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: +e.target.value }))}
                        style={{ width: 100, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={saveEdit} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#093880', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 4 }}>{p.title}</h3>
                    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{p.location} · <span style={{ textTransform: 'capitalize' }}>{p.category}</span></p>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#093880' }}>NPR {p.price?.toLocaleString()}/night</span>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>{p.bedrooms} bed · {p.maxGuests} guests</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ background: '#ecfdf5', color: '#16a34a', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>Active</span>
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
          ))}
        </div>
      )}

      {/* Confirm delete */}
      <AnimatePresence>
        {confirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              style={{ background: '#fff', borderRadius: 20, padding: '32px', maxWidth: 380, width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, color: '#0f172a', marginBottom: 8 }}>Delete Property?</h3>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>This action cannot be undone. All bookings for this property will remain in records.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => setConfirm(null)} style={{ padding: '11px 24px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Cancel</button>
                <button onClick={() => { deleteHostProperty(confirm); setConfirm(null) }}
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
// SECTION: Host Bookings
// ──────────────────────────────────────────────────
function HostBookingsSection({ user }) {
  const { getHostBookings } = useAppData()
  const bookings = getHostBookings(user.email)
  const confirmed = bookings.filter(b => b.status === 'confirmed')
  const cancelled = bookings.filter(b => b.status === 'cancelled')

  return (
    <div>
      <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 24, color: '#0f172a', marginBottom: 6 }}>Bookings</h2>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>{confirmed.length} active · {cancelled.length} cancelled</p>

      {bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📋</div>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 20, color: '#111827', marginBottom: 8 }}>No bookings yet</h3>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Bookings from guests will appear here once they book your properties.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bookings.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0f0f0', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flex: 1, minWidth: 0 }}>
                <img src={b.propertyImage} alt="" style={{ width: 64, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.propertyTitle}</p>
                  <p style={{ fontSize: 12, color: '#6b7280' }}>By {b.userName} · {b.checkIn} → {b.checkOut}</p>
                  <p style={{ fontSize: 12, color: '#6b7280' }}>{b.guests} guest{b.guests > 1 ? 's' : ''}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 14, color: '#093880' }}>NPR {b.totalPrice?.toLocaleString()}</p>
                </div>
                <span style={{ background: b.status === 'confirmed' ? '#ecfdf5' : '#fef2f2', color: b.status === 'confirmed' ? '#16a34a' : '#dc2626', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>
                  {b.status === 'confirmed' ? '✓ Confirmed' : '✗ Cancelled'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────
// SECTION: Analytics
// ──────────────────────────────────────────────────
function AnalyticsSection({ user, analytics }) {
  const { totalListings, totalBookings, totalEarnings, occupancyRate, monthlyData, topProperty } = analytics

  const conversionRate = totalListings > 0 ? Math.min(100, Math.round((totalBookings / Math.max(1, totalListings * 10)) * 100)) : 0

  return (
    <div>
      <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 24, color: '#0f172a', marginBottom: 6 }}>Analytics</h2>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28 }}>Deep insights into your property performance.</p>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Listings', value: totalListings, icon: '🏠', color: '#eff6ff', text: '#093880' },
          { label: 'Total Bookings', value: totalBookings, icon: '📅', color: '#ecfdf5', text: '#15803d' },
          { label: 'Total Earnings', value: `NPR ${totalEarnings.toLocaleString()}`, icon: '💰', color: '#fffbeb', text: '#b45309' },
          { label: 'Occupancy Rate', value: `${occupancyRate}%`, icon: '📊', color: '#eef2ff', text: '#4f46e5' },
          { label: 'Conversion Rate', value: `${conversionRate}%`, icon: '🎯', color: '#fdf4ff', text: '#7c3aed' },
        ].map(s => (
          <div key={s.label} style={{ background: s.color, borderRadius: 18, padding: '20px 18px' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 20, color: s.text }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1.5px solid #f0f0f0', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 20 }}>📈 Monthly Revenue (NPR)</h3>
          <BarChart data={monthlyData} field="revenue" color="#093880" label="Revenue" />
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
            {monthlyData.map((d, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: '#374151', fontWeight: 700 }}>NPR {d.revenue.toLocaleString()}</p>
                <p style={{ fontSize: 9, color: '#9ca3af' }}>{d.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1.5px solid #f0f0f0', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 20 }}>📅 Bookings per Month</h3>
          <BarChart data={monthlyData} field="bookings" color="#10b981" label="Bookings" />
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
            {monthlyData.map((d, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: '#374151', fontWeight: 700 }}>{d.bookings} bk</p>
                <p style={{ fontSize: 9, color: '#9ca3af' }}>{d.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Occupancy gauge */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1.5px solid #f0f0f0', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 16 }}>Occupancy Rate</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ flex: 1, height: 16, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${occupancyRate}%` }} transition={{ duration: 1, ease: 'easeOut' }}
              style={{ height: '100%', background: `linear-gradient(90deg, #093880, #63b74e)`, borderRadius: 999 }} />
          </div>
          <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 20, color: '#0f172a', flexShrink: 0 }}>{occupancyRate}%</span>
        </div>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
          Formula: (Total booked days / Total available days × 100)
        </p>
      </div>

      {/* Insights */}
      {topProperty && (
        <div style={{ background: 'linear-gradient(135deg, #093880, #1a56c4)', borderRadius: 20, padding: '24px', color: '#fff' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.7, marginBottom: 8 }}>🏆 Top Performing Property</p>
          <h4 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{topProperty.title}</h4>
          <p style={{ opacity: 0.75, fontSize: 13, marginBottom: 12 }}>{topProperty.location}</p>
          <div style={{ display: 'flex', gap: 16 }}>
            <div><p style={{ opacity: 0.7, fontSize: 11 }}>Price</p><p style={{ fontWeight: 700, fontSize: 14 }}>NPR {topProperty.price?.toLocaleString()}/night</p></div>
            <div><p style={{ opacity: 0.7, fontSize: 11 }}>Category</p><p style={{ fontWeight: 700, fontSize: 14, textTransform: 'capitalize' }}>{topProperty.category}</p></div>
          </div>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────
// SECTION: Profile
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
  const { getHostAnalytics } = useAppData()

  const [section, setSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }
  const analytics = getHostAnalytics(user?.email)

  const renderSection = () => {
    switch (section) {
      case 'dashboard': return <DashboardOverview user={user} analytics={analytics} setSection={setSection} />
      case 'add': return <AddPropertyForm user={user} onSuccess={() => setSection('listings')} />
      case 'listings': return <MyListings user={user} setSection={setSection} />
      case 'bookings': return <HostBookingsSection user={user} />
      case 'analytics': return <AnalyticsSection user={user} analytics={analytics} />
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
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1.5px solid #f0f0f0', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
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
        <div style={{ flex: 1, padding: '32px 32px', overflowY: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  )
}
