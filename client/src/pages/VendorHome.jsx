import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FiHome, FiPlus, FiList, FiCalendar, FiUser, FiLogOut,
  FiMenu, FiX, FiEdit2, FiTrash2, FiEye, FiCheck, FiClock, FiTrendingUp,
  FiDollarSign, FiAlertCircle, FiUpload, FiStar, FiFileText, FiBell, FiMessageSquare, FiShield, FiMessageCircle, FiSend, FiServer
} from 'react-icons/fi'
import { FaStar } from 'react-icons/fa'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useAppData } from '../context/AppDataContext'
import { useToast } from '../context/ToastContext'
import { hostAPI, mediaAPI, userAPI } from '../services/api'
import KYCPage from './KYCPage'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'
import CryptoJS from 'crypto-js'
import { io } from 'socket.io-client'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'
const SECRET_KEY = 'grihastha_default_secret_key'

// ──────────────────────────────────────────────────
// Sidebar config
// ──────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome },
  { id: 'listings', label: 'My Listings', icon: FiList },
  { id: 'bookings', label: 'Bookings', icon: FiCalendar },
  { id: 'messages', label: 'Messages', icon: FiMessageCircle },
  { id: 'reviews', label: 'Reviews', icon: FiMessageSquare },
  { id: 'kyc', label: 'KYC / Verify', icon: FiShield },
]

import { 
  Wifi, Wind, Car, Refrigerator, WashingMachine, Tv, 
  Waves, Dumbbell, TreePine, Sun, Flame, Zap 
} from 'lucide-react'

const ALL_AMENITIES = [
  'WiFi', 'Air Conditioning', 'Parking', 'Kitchen', 'Washing Machine',
  'TV', 'Pool', 'Gym', 'Garden', 'Balcony', 'Hot Water', 'Power Backup'
]

const AMENITY_ICONS = {
  'WiFi': Wifi,
  'Air Conditioning': Wind,
  'Parking': Car,
  'Kitchen': Refrigerator,
  'Washing Machine': WashingMachine,
  'TV': Tv,
  'Pool': Waves,
  'Gym': Dumbbell,
  'Garden': TreePine,
  'Balcony': Sun,
  'Hot Water': Flame,
  'Power Backup': Zap,
}
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
// Revenue BarChart using Recharts
// ──────────────────────────────────────────────────
function RevenueChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={18}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 10, border: '1px solid #f0f0f0', fontSize: 12 }}
          formatter={(v) => [`NPR ${v.toLocaleString()}`, 'Revenue']}
        />
        <Bar dataKey="revenue" fill="#093880" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Bookings AreaChart
function BookingsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="bookingsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 10, border: '1px solid #f0f0f0', fontSize: 12 }}
          formatter={(v) => [v, 'Bookings']}
        />
        <Area type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} fill="url(#bookingsGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ──────────────────────────────────────────────────
// Stat card
// ──────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, bg, gradient }) {
  return (
    <motion.div whileHover={{ y: -5, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }} transition={{ duration: 0.2 }}
      style={{ background: '#fff', borderRadius: 20, padding: '22px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1.5px solid #f0f4ff', display: 'flex', alignItems: 'flex-start', gap: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 20px 0 80px', background: bg, opacity: 0.5 }} />
      <div style={{ width: 48, height: 48, borderRadius: 14, background: gradient || bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 14px ${color}33` }}>
        <Icon size={22} style={{ color: gradient ? '#fff' : color }} />
      </div>
      <div style={{ position: 'relative' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{label}</p>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 26, color: '#0f172a', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>{sub}</p>}
      </div>
    </motion.div>
  )
}

// ──────────────────────────────────────────────────
// SECTION: Overview dashboard
// ──────────────────────────────────────────────────
function DashboardOverview({ user, analytics, setSection, isKycVerified, kycStatus }) {
  const { totalListings, totalBookings, totalEarnings, occupancyRate, monthlyData, topProperty } = analytics

  return (
    <div>
      {/* Welcome banner */}
      <div style={{ background: 'linear-gradient(135deg,#093880 0%,#1a56c4 60%,#2563eb 100%)', borderRadius: 20, padding: '28px 32px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, right: 80, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Host Dashboard</p>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 28, color: '#fff', marginBottom: 6, lineHeight: 1.2 }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, margin: 0 }}>Here's how your properties are performing today.</p>
      </div>

      {/* KYC alert */}
      {!isKycVerified && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: kycStatus === 'pending' ? '#fffbeb' : '#fef2f2', border: `1.5px solid ${kycStatus === 'pending' ? '#fde68a' : '#fecaca'}`, borderRadius: 16, padding: '16px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: kycStatus === 'pending' ? '#fef3c7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FiShield size={18} style={{ color: kycStatus === 'pending' ? '#d97706' : '#ef4444' }} />
            </div>
            <div>
              <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 13, color: '#0f172a', margin: 0 }}>
                {kycStatus === 'pending' ? 'KYC Under Review' : 'KYC Verification Required'}
              </p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0, marginTop: 2 }}>
                {kycStatus === 'pending'
                  ? 'Your National ID is being reviewed. Listings will be unlocked once approved.'
                  : 'Verify your National ID card to start listing properties on Grihastha.'}
              </p>
            </div>
          </div>
          {kycStatus !== 'pending' && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setSection('kyc')}
              style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#093880,#1a56c4)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Poppins',sans-serif" }}>
              Verify Now →
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="vendor-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 18, marginBottom: 28 }}>
        <StatCard icon={FiHome} label="Total Listings" value={totalListings} sub="Active properties" color="#093880" bg="#eff6ff" gradient="linear-gradient(135deg,#093880,#1a56c4)" />
        <StatCard icon={FiCalendar} label="Total Bookings" value={totalBookings} sub="Confirmed stays" color="#10b981" bg="#ecfdf5" gradient="linear-gradient(135deg,#059669,#10b981)" />
        <StatCard icon={FiDollarSign} label="Total Earnings" value={`NPR ${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="All-time revenue" color="#f59e0b" bg="#fffbeb" gradient="linear-gradient(135deg,#d97706,#f59e0b)" />
        <StatCard icon={FiTrendingUp} label="Occupancy Rate" value={`${occupancyRate}%`} sub="Booked vs available" color="#6366f1" bg="#eef2ff" gradient="linear-gradient(135deg,#4f46e5,#6366f1)" />
      </div>

      {/* Charts area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1.5px solid #f0f4ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#0f172a', margin: 0 }}>Monthly Revenue (NPR)</h3>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#eff6ff', color: '#093880', padding: '3px 10px', borderRadius: 999 }}>Last 6 months</span>
          </div>
          <RevenueChart data={monthlyData} />
        </div>
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1.5px solid #f0f4ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#0f172a', margin: 0 }}>Bookings per Month</h3>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#ecfdf5', color: '#059669', padding: '3px 10px', borderRadius: 999 }}>Trend</span>
          </div>
          <BookingsChart data={monthlyData} />
        </div>
      </div>

      {/* Insights row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'stretch' }}>
        {topProperty ? (
          <div style={{ background: 'linear-gradient(135deg, #093880, #1a56c4)', borderRadius: 20, padding: '24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.85, marginBottom: 10 }}>
              <FiStar size={12} /> Top Performer
            </p>
            <h4 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 17, marginBottom: 4 }}>{topProperty.title}</h4>
            <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 14 }}>{topProperty.location}</p>
            <p style={{ fontSize: 14, fontWeight: 800, background: 'rgba(255,255,255,0.15)', display: 'inline-block', padding: '6px 14px', borderRadius: 10 }}>NPR {topProperty.price?.toLocaleString()} / night</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px 24px', border: '1.5px solid #f0f4ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><FiHome size={26} style={{ color: '#94a3b8' }} /></div>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>No top performer yet</p>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>Add properties to see insights</p>
          </div>
        )}
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1.5px solid #f0f4ff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', marginBottom: 14 }}>Quick Actions</p>
          {[
            { label: '+ Add New Property', action: () => setSection('add'), style: { background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', boxShadow: '0 4px 16px rgba(9,56,128,0.25)' } },
            { label: 'View All Bookings', action: () => setSection('bookings'), style: { background: '#f1f5f9', color: '#374151', border: '1.5px solid #e2e8f0' } },
            { label: 'My Listings', action: () => setSection('listings'), style: { background: '#f1f5f9', color: '#374151', border: '1.5px solid #e2e8f0' } },
          ].map((btn, i) => (
            <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={btn.action}
              style={{ display: 'block', width: '100%', padding: '12px', borderRadius: 12, border: btn.style.border || 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: i < 2 ? 10 : 0, fontFamily: "'Poppins', sans-serif", transition: 'all 0.2s', ...btn.style }}>
              {btn.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}
// SECTION: Add Property (with legal doc + approval)
// ──────────────────────────────────────────────────
function AddPropertyForm({ user, onSuccess }) {
  const { addHostProperty } = useAppData()
  const { showToast } = useToast()
  const [searchingLocation, setSearchingLocation] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', price: '', category: 'apartment',
    location: '', amenities: [], maxGuests: 2, bedrooms: 1, bathrooms: 1,
    image: '', images: [],
    latitude: '', longitude: '',
    city: '', district: '', zipCode: '',
  })
  const [legalDoc, setLegalDoc] = useState(null)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)

  const patch = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))
  const toggleAmenity = (a) => setForm(f => ({
    ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
  }))

  const handleDocUpload = (e) => {
    const file = e.target.files[0]
    if (file) setLegalDoc(file)
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      try {
        const { data } = await mediaAPI.upload(formData)
        setForm(f => ({
          ...f,
          images: [...(f.images || []), data.data.url],
          image: f.image || data.data.url // Use first image as main image
        }))
      } catch (err) {
        console.error('Failed to upload image:', err)
        showToast('Failed to upload image.', 'error')
      }
    }
  }

  const removeImage = (idx) => {
    setForm(f => {
      const newImages = f.images.filter((_, i) => i !== idx)
      return {
        ...f,
        images: newImages,
        image: newImages[0] || '' // Fallback to first image or empty
      }
    })
  }

  const handleLocationBlur = async () => {
    if (!form.location) return
    setSearchingLocation(true)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(form.location)}`)
      const data = await response.json()
      if (data && data.length > 0) {
        const result = data[0]
        const { lat, lon } = result
        const address = result.address || {}
        
        setForm(f => ({ 
          ...f, 
          latitude: lat, 
          longitude: lon,
          city: address.city || address.town || address.village || '',
          district: address.county || '',
          zipCode: address.postcode || ''
        }))
        showToast(`Coordinates found: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`, 'success')
      } else {
        showToast('Location not found on map.', 'warning')
      }
    } catch (err) {
      console.error('Failed to fetch coordinates:', err)
    } finally {
      setSearchingLocation(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.price || !form.location) {
      setMsg({ type: 'error', text: 'Please fill Title, Price and Location.' })
      return
    }
    if (!form.images || form.images.length < 5) {
      setMsg({ type: 'error', text: 'Please upload at least 5 property images.' })
      return
    }
    if (!legalDoc) {
      setMsg({ type: 'error', text: 'Legal document is required before submitting.' })
      return
    }
    setSubmitting(true)
    let legalDocUrl = ''
    try {
      const formData = new FormData()
      formData.append('file', legalDoc)
      const { data } = await mediaAPI.upload(formData)
      legalDocUrl = data.data.url
    } catch (err) {
      console.error('Failed to upload legal doc:', err)
      setMsg({ type: 'error', text: 'Failed to upload legal document.' })
      setSubmitting(false)
      return
    }

    const result = await addHostProperty(
      { ...form, price: +form.price, maxGuests: +form.maxGuests, bedrooms: +form.bedrooms, bathrooms: +form.bathrooms, legalDocName: legalDoc.name, legalDocUrl: legalDocUrl },
      user.email, user.name
    )
    setSubmitting(false)
    if (result.ok) {
      setMsg({ type: 'success', text: 'Property submitted for admin approval! You will be notified once reviewed.' })
      showToast('Property submitted! Pending admin approval ⏳', 'info')
      setForm({ title: '', description: '', price: '', category: 'apartment', location: '', amenities: [], maxGuests: 2, bedrooms: 1, bathrooms: 1, image: '', images: [] })
      setLegalDoc(null)
      setTimeout(() => onSuccess?.(), 1800)
    }
  }

  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111827', background: '#fafafa', outline: 'none', fontFamily: "'Open Sans', sans-serif", boxSizing: 'border-box' }

  return (
    <div>
      <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 24, color: '#0f172a', marginBottom: 6 }}>Add New Property</h2>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Fill in the details to list your property for guests.</p>
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <FiAlertCircle size={15} style={{ color: '#d97706', flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>Properties require admin approval before going live. Legal documentation is mandatory.</p>
      </div>

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
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Location * {searchingLocation && <span style={{ color: '#093880', fontWeight: 400 }}> (Searching...)</span>}
            </label>
            <input id="prop-location" placeholder="e.g. Thamel, Kathmandu" value={form.location} onChange={patch('location')} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#093880'} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; handleLocationBlur() }} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>City</label>
            <input id="prop-city" placeholder="e.g. Kathmandu" value={form.city} onChange={patch('city')} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#093880'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>District</label>
            <input id="prop-district" placeholder="e.g. Kathmandu" value={form.district} onChange={patch('district')} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#093880'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Zip Code</label>
            <input id="prop-zip" placeholder="e.g. 44600" value={form.zipCode} onChange={patch('zipCode')} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#093880'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          </div>

          <div style={{ gridColumn: '1 / -1', height: 400, marginBottom: 12, borderRadius: 12, overflow: 'hidden', border: '1.5px solid #e5e7eb', position: 'relative' }}>
            <MapContainer center={[27.7172, 85.3240]} zoom={12} style={{ height: '100%', width: '100%' }}>
              <ChangeView center={[form.latitude || 27.7172, form.longitude || 85.3240]} zoom={form.latitude ? 15 : 12} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {form.latitude && form.longitude && (
                <Marker position={[form.latitude, form.longitude]}>
                  <Popup>{form.location}</Popup>
                </Marker>
              )}
            </MapContainer>

            {searchingLocation && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    style={{ width: 30, height: 30, border: '3px solid #f3f3f3', borderTop: '3px solid #093880', borderRadius: '50%' }}
                  />
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#093880' }}>Searching location...</p>
                </div>
              </div>
            )}
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

        {/* Image upload */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
            Property Images <span style={{ color: '#dc2626' }}>* Min 5 Required</span>
          </label>
          <label htmlFor="property-images-upload"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 12, border: `2px dashed #e5e7eb`, background: '#fafafa', cursor: 'pointer', transition: 'all 0.2s' }}>
            <FiUpload size={20} style={{ color: '#9ca3af', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>
                Click to upload property images
              </p>
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>JPG, PNG, WebP up to 5MB · Minimum 5 images</p>
            </div>
          </label>
          <input id="property-images-upload" type="file" accept=".jpg,.jpeg,.png,.webp" multiple style={{ display: 'none' }} onChange={handleImageUpload} />
          
          {/* Previews */}
          {form.images?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginTop: 12 }}>
              {form.images.map((img, idx) => (
                <div key={idx} style={{ aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', position: 'relative' }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legal Document Upload */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
            Legal Document <span style={{ color: '#dc2626' }}>* Required</span>
          </label>
          <label htmlFor="legal-doc-upload"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 12, border: `2px dashed ${legalDoc ? '#093880' : '#e5e7eb'}`, background: legalDoc ? '#f0f5ff' : '#fafafa', cursor: 'pointer', transition: 'all 0.2s' }}>
            <FiFileText size={20} style={{ color: legalDoc ? '#093880' : '#9ca3af', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: legalDoc ? '#093880' : '#6b7280' }}>
                {legalDoc ? legalDoc.name : 'Click to upload ownership deed, property registration, or ID proof'}
              </p>
              {!legalDoc && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>PDF, JPG, PNG up to 10MB</p>}
            </div>
            {legalDoc && <span style={{ marginLeft: 'auto', background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>✓ Uploaded</span>}
          </label>
          <input id="legal-doc-upload" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleDocUpload} />
          {!legalDoc && (
            <p style={{ fontSize: 12, color: '#dc2626', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiAlertCircle size={12} /> Upload is required to enable property submission.
            </p>
          )}
        </div>

        {/* Amenities */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 10 }}>Amenities</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALL_AMENITIES.map(a => {
              const sel = form.amenities.includes(a)
              const Icon = AMENITY_ICONS[a]
              return (
                <button key={a} type="button" onClick={() => toggleAmenity(a)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 999, border: `1.5px solid ${sel ? '#093880' : '#e5e7eb'}`, background: sel ? '#eff6ff' : '#fff', color: sel ? '#093880' : '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {Icon && <Icon size={14} style={{ color: sel ? '#093880' : '#9ca3af' }} />}
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

        <motion.button id="submit-property-btn" whileHover={legalDoc ? { scale: 1.02 } : {}} whileTap={legalDoc ? { scale: 0.98 } : {}} type="submit"
          disabled={submitting || !legalDoc}
          title={!legalDoc ? 'Upload a legal document to enable submission' : ''}
          style={{ padding: '14px 36px', borderRadius: 14, border: 'none', background: legalDoc ? 'linear-gradient(135deg, #093880, #1a56c4)' : '#e5e7eb', color: legalDoc ? '#fff' : '#9ca3af', fontSize: 15, fontWeight: 700, cursor: legalDoc ? 'pointer' : 'not-allowed', boxShadow: legalDoc ? '0 4px 20px rgba(9,56,128,0.3)' : 'none', fontFamily: "'Poppins', sans-serif", opacity: submitting ? 0.8 : 1, transition: 'all 0.2s' }}>
          {submitting ? 'Submitting...' : legalDoc ? 'Submit for Approval' : '⚠ Upload Legal Doc to Continue'}
        </motion.button>
      </form>
    </div>
  )
}

// ──────────────────────────────────────────────────
// SECTION: My Listings
// ──────────────────────────────────────────────────
function MyListings({ user, setSection }) {
  const { getHostProperties, deleteHostProperty, updateHostProperty, fetchHostListings } = useAppData()
  const { showToast } = useToast()
  
  useEffect(() => {
    fetchHostListings()
  }, [fetchHostListings])

  const props = getHostProperties(user.id)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [confirm, setConfirm] = useState(null)

  const startEdit = (p) => { setEditingId(p.id); setEditForm({ title: p.title || '', price: p.price || '', location: p.location || '' }) }
  const saveEdit = () => { updateHostProperty(editingId, editForm); setEditingId(null); showToast('Property updated successfully.', 'success') }

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
          {props.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ boxShadow: '0 8px 28px rgba(0,0,0,0.09)' }}
              style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #f0f4ff', padding: '18px 20px', display: 'flex', gap: 18, alignItems: 'flex-start', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s' }}>
              <img src={p.image} alt={p.title} style={{ width: 110, height: 86, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingId === p.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                      style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #093880', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input placeholder="Location" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }} />
                      <input placeholder="Price" type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: +e.target.value }))}
                        style={{ width: 100, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={saveEdit} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#093880,#1a56c4)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#6b7280' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#111827', margin: 0 }}>{p.title}</h3>
                      {p.approvalStatus === 'pending' && <span style={{ background: '#fffbeb', color: '#d97706', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999, border: '1px solid #fde68a', flexShrink: 0 }}>⏳ Pending</span>}
                      {p.approvalStatus === 'approved' && <span style={{ background: '#ecfdf5', color: '#16a34a', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999, flexShrink: 0 }}>✅ Approved</span>}
                      {p.approvalStatus === 'rejected' && <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999, flexShrink: 0 }}>❌ Rejected</span>}
                    </div>
                    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{p.location} · <span style={{ textTransform: 'capitalize' }}>{p.category}</span></p>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#093880' }}>NPR {p.price?.toLocaleString()}/night</span>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>{p.bedrooms} bed · {p.maxGuests} guests</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => startEdit(p)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>
                        <FiEdit2 size={12} /> Edit
                      </button>
                      <button onClick={() => setConfirm(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 10, border: '1.5px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#dc2626' }}>
                        <FiTrash2 size={12} /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
              {p.latitude && p.longitude && (
                <div style={{ width: 120, height: 86, borderRadius: 14, overflow: 'hidden', border: '1.5px solid #e5e7eb', flexShrink: 0, alignSelf: 'center' }}>
                  <MapContainer center={[p.latitude, p.longitude]} zoom={11} zoomControl={false} attributionControl={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[p.latitude, p.longitude]} />
                  </MapContainer>
                </div>
              )}
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
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><FiAlertCircle size={42} style={{ color: '#dc2626' }} /></div>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, color: '#0f172a', marginBottom: 8 }}>Delete Property?</h3>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>This action cannot be undone. All bookings for this property will remain in records.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => setConfirm(null)} style={{ padding: '11px 24px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Cancel</button>
                <button onClick={() => { deleteHostProperty(confirm); setConfirm(null); showToast('Property deleted.', 'warning') }}
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
  const { getHostBookings, fetchHostBookings } = useAppData()

  useEffect(() => {
    if (user?.id) fetchHostBookings(user.id)
  }, [user?.id, fetchHostBookings])

  console.log('[HostBookingsSection] user.id is:', user?.id, 'email is:', user?.email)
  const bookings = getHostBookings(user.id)
  console.log('[HostBookingsSection] bookings returned:', bookings.length)
  
  // Sort bookings by creation date (newest first)
  const sortedBookings = [...bookings].sort((a, b) => new Date(b.createdAt || 0) < new Date(a.createdAt || 0) ? 1 : -1)

  const confirmed = sortedBookings.filter(b => b.status === 'confirmed')
  const cancelled = sortedBookings.filter(b => b.status === 'cancelled')

  return (
    <div>
      <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 24, color: '#0f172a', marginBottom: 6 }}>Bookings</h2>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>{confirmed.length} active · {cancelled.length} cancelled</p>

      {bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ marginBottom: 16 }}><FiCalendar size={52} style={{ color: '#9ca3af' }} /></div>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 20, color: '#111827', marginBottom: 8 }}>No bookings yet</h3>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Bookings from guests will appear here once they book your properties.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sortedBookings.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${b.status === 'confirmed' ? '#d1fae5' : '#fee2e2'}`, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flex: 1, minWidth: 0 }}>
                <img src={b.propertyImage} alt="" style={{ width: 70, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.propertyTitle}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Guest: <strong style={{ color: '#374151' }}>{b.userName}</strong></p>
                  <p style={{ fontSize: 12, color: '#9ca3af' }}>{b.checkIn} → {b.checkOut} · {b.guests} guest{b.guests > 1 ? 's' : ''}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 15, color: '#093880' }}>NPR {b.totalPrice?.toLocaleString()}</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Total</p>
                </div>
                {b.status === 'confirmed' && (
                  <span style={{ background: '#ecfdf5', color: '#16a34a', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999, border: '1px solid #86efac' }}>✓ Confirmed</span>
                )}
                {b.status === 'pending' && (
                  <span style={{ background: '#fffbeb', color: '#d97706', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999, border: '1px solid #fde68a' }}>⌛ Pending</span>
                )}
                {b.status === 'cancelled' && (
                  <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999, border: '1px solid #fecaca' }}>✕ Cancelled</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────
// SECTION: Host Reviews
// ──────────────────────────────────────────────────
function HostMessagesSection({ user }) {
  const { showToast } = useToast()
  const [conversations, setConversations] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingConv, setLoadingConv] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isLocalTyping, setIsLocalTyping] = useState(false)

  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    const fetchConversations = async () => {
      setLoadingConv(true)
      try {
        const token = localStorage.getItem('grihastha_token')
        const { data } = await axios.get(`${API_BASE_URL}/v1/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (data?.success) {
          setConversations(data.data)
          if (data.data.length > 0) setSelectedConv(data.data[0])
        }
      } catch (err) {
        showToast('Failed to load conversations.', 'error')
      } finally {
        setLoadingConv(false)
      }
    }
    fetchConversations()
  }, [showToast])

  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const s = io(API_BASE_URL)
    setSocket(s)
    
    s.on('connect', () => {
      console.log('[SOCKET] Connected to server')
    })
    
    return () => s.disconnect()
  }, [])

  useEffect(() => {
    if (!selectedConv || !socket) return
    
    // Clear messages when switching conversations
    setMessages([])
    
    // Join conversation room
    socket.emit('join_conversation', selectedConv.id)
    
    const fetchMessages = async () => {
      setLoadingMsg(true)
      try {
        const token = localStorage.getItem('grihastha_token')
        const { data } = await axios.get(`${API_BASE_URL}/v1/conversations/${selectedConv.id}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (data?.success) {
          const decrypted = data.data.map(msg => {
            try {
              const bytes = CryptoJS.AES.decrypt(msg.content, SECRET_KEY)
              const decryptedText = bytes.toString(CryptoJS.enc.Utf8)
              return { ...msg, content: decryptedText || msg.content }
            } catch (e) { return msg }
          })
          setMessages(decrypted)
        }
      } catch (err) {
        showToast('Failed to load messages.', 'error')
      } finally {
        setLoadingMsg(false)
      }
    }
    
    fetchMessages()
    
    const handleReceiveMessage = (data) => {
      console.log('[SOCKET] Received message:', data)
      // Decrypt message
      let decryptedContent = data.content
      try {
        const bytes = CryptoJS.AES.decrypt(data.content, SECRET_KEY)
        const text = bytes.toString(CryptoJS.enc.Utf8)
        decryptedContent = text || data.content
      } catch (e) {}
      
      setMessages(prev => [...prev, { ...data, content: decryptedContent }])
    }
    
    const handleUserTyping = (data) => {
      if (data.sender_id !== user.id) {
        setIsTyping(true)
      }
    }
    
    const handleUserStopTyping = (data) => {
      if (data.sender_id !== user.id) {
        setIsTyping(false)
      }
    }
    
    socket.on('receive_message', handleReceiveMessage)
    socket.on('user_typing', handleUserTyping)
    socket.on('user_stop_typing', handleUserStopTyping)
    
    return () => {
      socket.off('receive_message', handleReceiveMessage)
      socket.off('user_typing', handleUserTyping)
      socket.off('user_stop_typing', handleUserStopTyping)
    }
  }, [selectedConv, socket, showToast])

  const handleInputChange = (e) => {
    setNewMessage(e.target.value)
    
    if (socket && selectedConv) {
      // Only emit typing if we haven't already
      if (!isLocalTyping) {
        setIsLocalTyping(true)
        socket.emit('typing', { conversationId: selectedConv.id, sender_id: user.id })
      }
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { conversationId: selectedConv.id, sender_id: user.id })
        setIsLocalTyping(false)
      }, 2000)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConv) return
    setSending(true)
    try {
      const token = localStorage.getItem('grihastha_token')
      const encryptedText = CryptoJS.AES.encrypt(newMessage.trim(), SECRET_KEY).toString()
      const { data } = await axios.post(`${API_BASE_URL}/v1/conversations/${selectedConv.id}/messages`, 
        { text: encryptedText },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data?.success) {
        setMessages([...messages, { ...data.data, content: newMessage.trim() }])
        setNewMessage('')
        
        // Emit to socket
        socket.emit('send_message', {
          conversationId: selectedConv.id,
          content: encryptedText,
          sender_id: user.id,
          created_at: data.data.created_at
        })
      }
    } catch (err) {
      showToast('Failed to send message.', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleStartAdminChat = async () => {
    try {
      const token = localStorage.getItem('grihastha_token')
      const { data } = await axios.post(`${API_BASE_URL}/v1/conversations`, {}, { headers: { Authorization: `Bearer ${token}` } })
      if (data?.success) {
        showToast("Opening chat with Admin Support...", "success")
        const response = await axios.get(`${API_BASE_URL}/v1/conversations`, { headers: { Authorization: `Bearer ${token}` } })
        if (response.data?.success) {
          setConversations(response.data.data)
          const found = response.data.data.find(c => c.id === data.id)
          if (found) setSelectedConv(found)
        }
      }
    } catch (err) { showToast('Failed to start admin chat.', 'error') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: "'Poppins', sans-serif" }}>Messages</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Chat with your guests and platform support</p>
        </div>
        <button onClick={handleStartAdminChat} style={{ padding: '8px 16px', borderRadius: 12, background: '#e0f2fe', color: '#0369a1', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Contact Support
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', background: '#fff', borderRadius: 20, border: '1.5px solid #e5e7eb', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 320, borderRight: '1.5px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingConv ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Loading...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No conversations yet.</div>
            ) : (
              conversations.map(conv => {
                const isDispute = !conv.host_id
                const otherName = isDispute ? 'Admin Support' : (conv.guest_id === user?.id ? conv.host_name : conv.guest_name)
                const avatarUrl = isDispute ? null : (conv.guest_id === user?.id ? conv.host_avatar : conv.guest_avatar)
                const isSelected = selectedConv?.id === conv.id
                return (
                  <div key={conv.id} onClick={() => setSelectedConv(conv)}
                    style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: isSelected ? '#f1f5f9' : 'transparent', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: isDispute ? '#e0f2fe' : '#093880', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDispute ? '#0369a1' : '#fff', fontWeight: 700, fontSize: 14 }}>
                      {avatarUrl ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : isDispute ? <FiServer size={18} /> : otherName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{otherName}</div>
                      <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.listing_title || 'Dispute'}</div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
          {selectedConv ? (
            <>
              <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: !selectedConv.host_id ? '#e0f2fe' : '#093880', display: 'flex', alignItems: 'center', justifyContent: 'center', color: !selectedConv.host_id ? '#0369a1' : '#fff', fontWeight: 700, fontSize: 14 }}>
                  {!selectedConv.host_id ? <FiServer size={18} /> : (selectedConv.guest_id === user?.id ? selectedConv.host_avatar : selectedConv.guest_avatar) ? <img src={selectedConv.guest_id === user?.id ? selectedConv.host_avatar : selectedConv.guest_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (!selectedConv.host_id ? 'A' : (selectedConv.guest_id === user?.id ? selectedConv.host_name : selectedConv.guest_name).charAt(0).toUpperCase())}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{!selectedConv.host_id ? 'Admin Support' : (selectedConv.guest_id === user?.id ? selectedConv.host_name : selectedConv.guest_name)}</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{selectedConv.listing_title || 'Dispute Ticket'}</p>
                </div>
              </div>
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {loadingMsg && messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#64748b' }}>Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14, marginTop: 'auto', marginBottom: 'auto' }}>No messages yet.</div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user?.id || (user?.role === 'admin' && msg.sender_admin_id)
                    const isAdminMsg = !!msg.sender_admin_id
                    return (
                      <div key={msg.id || idx} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px', background: isMe ? '#093880' : isAdminMsg ? '#e0f2fe' : '#fff', color: isMe ? '#fff' : '#1e293b', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: 13, border: isMe ? 'none' : '1px solid #e2e8f0' }}>
                          {!isMe && <div style={{ fontSize: 10, fontWeight: 700, color: isAdminMsg ? '#0369a1' : '#64748b', marginBottom: 2 }}>{isAdminMsg ? 'Admin' : 'Guest'}</div>}
                          <div style={{ wordBreak: 'break-word' }}>{msg.content}</div>
                          <div style={{ fontSize: 9, opacity: 0.7, textAlign: 'right', marginTop: 4 }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    )
                  })
                )}
                {isTyping && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 2px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b' }}
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} style={{ padding: '16px', background: '#fff', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 10 }}>
                <input type="text" value={newMessage} onChange={handleInputChange} placeholder="Type your message..." style={{ flex: 1, padding: '12px 16px', borderRadius: 999, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }} />
                <button type="submit" disabled={sending || !newMessage.trim()} style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: sending || !newMessage.trim() ? 0.6 : 1 }}><FiSend size={18} /></button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <FiMessageSquare size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <p style={{ fontSize: 15, fontWeight: 600 }}>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function HostReviewsSection({ user }) {
  const { getHostProperties, getPropertyReviews, getPropertyAverageRating } = useAppData()
  const navigate = useNavigate()
  const props = getHostProperties(user.id)

  const allReviewsWithProp = props.flatMap(p => {
    const revs = getPropertyReviews(p.id)
    return revs.map(r => ({ ...r, propertyTitle: p.title, propertyId: p.id, propertyImage: p.image }))
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const totalRating = allReviewsWithProp.reduce((sum, r) => sum + r.rating, 0)
  const avgRating = allReviewsWithProp.length > 0 ? (totalRating / allReviewsWithProp.length).toFixed(1) : null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 24, color: '#0f172a', margin: 0 }}>Guest Reviews</h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{allReviewsWithProp.length} review{allReviewsWithProp.length !== 1 ? 's' : ''} across {props.length} propert{props.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        {avgRating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: 16, padding: '12px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <FaStar style={{ color: '#f59e0b' }} size={22} />
            <div>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 24, color: '#0f172a', lineHeight: 1 }}>{avgRating}</p>
              <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Avg Rating</p>
            </div>
          </div>
        )}
      </div>

      {/* Per-property summary cards */}
      {props.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 28, marginTop: 20 }}>
          {props.map(p => {
            const revs = getPropertyReviews(p.id)
            const avg = getPropertyAverageRating(p.id)
            return (
              <motion.div key={p.id} whileHover={{ y: -3 }}
                style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0f0f0', padding: '14px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', cursor: 'pointer' }}
                onClick={() => navigate(`/property/${p.id}/reviews`)}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <img src={p.image} alt="" style={{ width: 44, height: 38, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {avg ? (
                    <>
                      <FaStar style={{ color: '#f59e0b' }} size={13} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{avg}</span>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>· {revs.length} review{revs.length !== 1 ? 's' : ''}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>No reviews yet</span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {allReviewsWithProp.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 20, border: '1.5px solid #f0f0f0' }}>
          <FiMessageSquare size={52} style={{ color: '#d1d5db', marginBottom: 12 }} />
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 18, color: '#374151', marginBottom: 8 }}>No reviews yet</h3>
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Guest reviews will appear here once guests book and review your properties.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {allReviewsWithProp.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f0f0f0', padding: '16px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #093880, #1a56c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                  {r.avatar || r.userName?.charAt(0)?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{r.userName}</span>
                      <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>{r.date}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(s => <FaStar key={s} size={12} style={{ color: s <= r.rating ? '#f59e0b' : '#e5e7eb' }} />)}
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 6 }}>{r.comment}</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', borderRadius: 8, padding: '4px 10px' }}>
                    <FiHome size={10} style={{ color: '#093880' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#093880' }}>{r.propertyTitle}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────
// SECTION: Profile
// ──────────────────────────────────────────────────
function ProfileSection({ user, onLogout, onAvatarUpload }) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 24, color: '#0f172a', marginBottom: 24 }}>My Profile</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 780 }}>
        {/* Profile card */}
        <div style={{ gridColumn: '1 / -1', background: '#fff', borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1.5px solid #f0f4ff', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg,#0a2342,#093880,#1a56c4)', padding: '32px 28px', display: 'flex', alignItems: 'center', gap: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            
            {/* Avatar with upload overlay */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'linear-gradient(135deg,#4f8ef7,#93c5fd)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a2342', fontWeight: 900, fontSize: 30, fontFamily: "'Poppins', sans-serif", overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                {user?.avatar_url ? <img src={user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user?.avatar || user?.name?.charAt(0).toUpperCase())}
              </div>
              <button 
                onClick={() => document.getElementById('profile-avatar-upload-input').click()}
                style={{ position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: '50%', background: '#fff', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                title="Upload Profile Picture"
              >
                <FiUpload size={12} style={{ color: '#093880' }} />
              </button>
              <input type="file" id="profile-avatar-upload-input" style={{ display: 'none' }} accept="image/*" onChange={onAvatarUpload} />
            </div>

            <div style={{ color: '#fff' }}>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 4 }}>{user?.name}</h3>
              <p style={{ opacity: 0.7, fontSize: 14, marginBottom: 8 }}>{user?.email}</p>
              <span style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, display: 'inline-block' }}>Host Account</span>
            </div>
          </div>
          <div style={{ padding: '24px 28px' }}>
            {[
              { label: 'Full Name', value: user?.name },
              { label: 'Email Address', value: user?.email },
              { label: 'Account Type', value: 'Host (Property Owner)' },
            ].map((item, i, arr) => (
              <div key={item.label} style={{ padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid #f0f4ff' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
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
    </div>
  )
}

// ──────────────────────────────────────────────────
// MAIN VendorHome component
// ──────────────────────────────────────────────────
export default function VendorHome() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const { getHostAnalytics, getUserKYC, fetchHostListings, fetchHostBookings } = useAppData()

  const [section, setSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  const [dbKycStatus, setDbKycStatus] = useState('not_submitted')

  useEffect(() => {
    const fetchKycStatus = async () => {
      try {
        const { data } = await hostAPI.getVerificationStatus()
        setDbKycStatus(data.status)
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Failed to fetch KYC status:', err)
        }
      }
    }
    fetchKycStatus()
  }, [])

  useEffect(() => {
    if (user?.id) fetchHostListings(user.id)
  }, [user?.id, fetchHostListings])

  useEffect(() => {
    if (user?.id) fetchHostBookings(user.id)
  }, [user?.id, fetchHostBookings])

  const { showToast } = useToast()

  const handleLogout = () => { logout(); navigate('/') }
  
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const res = await mediaAPI.upload(formData)
      if (res.data?.success) {
        const url = res.data.data.url
        const profileRes = await userAPI.updateProfile({ avatar_url: url })
        if (profileRes.data?.success) {
          showToast('Profile picture updated!', 'success')
          updateUser({ avatar_url: url })
        }
      }
    } catch (err) {
      showToast('Failed to upload profile picture', 'error')
      console.error(err)
    }
  }

  const analytics = getHostAnalytics(user?.id)

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const kycData = getUserKYC?.(user?.email) || { status: 'not_submitted' }
  const isKycVerified = dbKycStatus === 'approved' || dbKycStatus === 'APPROVED' || dbKycStatus === 'verified' || dbKycStatus === 'verified'

  // KYC Gate — shown when host tries to access gated sections without verification
  const KYCGate = () => (
    <div style={{ maxWidth: 520 }}>
      <div style={{ background: '#fff', borderRadius: 22, border: '1.5px solid #fee2e2', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#fef2f2,#fff7ed)', padding: '32px', textAlign: 'center', borderBottom: '1px solid #fde8d8' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#fff', border: '2px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(239,68,68,0.12)' }}>
            <FiShield size={30} style={{ color: '#ef4444' }} />
          </div>
          <h3 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 20, color: '#0f172a', marginBottom: 8 }}>KYC Verification Required</h3>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
            You need to verify your identity with a <strong>National ID card</strong> before you can list or manage properties.
          </p>
        </div>
        <div style={{ padding: '24px 28px' }}>
          {[
            { icon: '🪪', text: 'Upload your National ID card (front & back)' },
            { icon: '⏱️', text: 'Admin reviews and approves within 1–2 days' },
            { icon: '✅', text: 'Once verified, you can list properties' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < 2 ? 14 : 0 }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{s.text}</p>
            </div>
          ))}
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setSection('kyc')}
            style={{ marginTop: 24, width: '100%', padding: '13px', borderRadius: 13, border: 'none', background: 'linear-gradient(135deg,#093880,#1a56c4)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Poppins',sans-serif", boxShadow: '0 4px 16px rgba(9,56,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <FiShield size={15} /> Complete KYC Verification
          </motion.button>
          {(dbKycStatus === 'pending' || dbKycStatus === 'under_review') && (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#f59e0b', marginTop: 12, fontWeight: 600 }}>
              ⏳ Your ID is currently under review. Please wait for admin approval.
            </p>
          )}
        </div>
      </div>
    </div>
  )

  const renderSection = () => {
    switch (section) {
      case 'dashboard': return <DashboardOverview user={user} analytics={analytics} setSection={setSection} isKycVerified={isKycVerified} kycStatus={dbKycStatus} />
      case 'add': return isKycVerified ? <AddPropertyForm user={user} onSuccess={() => setSection('listings')} /> : <KYCGate />
      case 'listings': return isKycVerified ? <MyListings user={user} setSection={setSection} /> : <KYCGate />
      case 'bookings': return <HostBookingsSection user={user} />
      case 'messages': return <HostMessagesSection user={user} />
      case 'reviews': return <HostReviewsSection user={user} />
      case 'kyc': return <KYCPage onBack={() => setSection('dashboard')} />
      case 'profile': return <ProfileSection user={user} onLogout={handleLogout} onAvatarUpload={handleAvatarUpload} />
      default: return null
    }
  }

  const Sidebar = ({ isMobile = false }) => (
    <div style={{
      width: isMobile ? '100%' : 252,
      background: 'linear-gradient(180deg, #0a2342 0%, #0d2d5e 60%, #093880 100%)',
      borderRight: 'none',
      display: 'flex',
      flexDirection: 'column',
      height: isMobile ? 'auto' : '100vh',
      position: isMobile ? 'relative' : 'sticky',
      top: 0,
      flexShrink: 0,
      boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
            <FiHome style={{ color: '#fff' }} size={18} />
          </div>
          <div>
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 17, color: '#fff', letterSpacing: '-0.3px' }}>Grihastha</span>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Host Portal</p>
          </div>
        </div>
      </div>

      {/* User chip */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.08)' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #4f8ef7, #93c5fd)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a2342', fontWeight: 900, fontSize: 14, flexShrink: 0, fontFamily: "'Poppins', sans-serif", overflow: 'hidden' }}>
            {user?.avatar_url ? <img src={user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user?.avatar || user?.name?.charAt(0).toUpperCase())}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Host Account</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 10px 6px' }}>Menu</p>
        {NAV_ITEMS.map(item => {
          const active = section === item.id
          return (
            <motion.button key={item.id} id={`nav-${item.id}`}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setSection(item.id); setSidebarOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%', textAlign: 'left', transition: 'all 0.18s',
                background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                fontFamily: "'Open Sans', sans-serif",
                boxShadow: active ? 'inset 0 0 0 1px rgba(255,255,255,0.12)' : 'none',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' } }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 9, background: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.18s' }}>
                <item.icon size={15} />
              </div>
              {item.label}
              {item.id === 'add' && (
                <span style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>+</span>
              )}
              {active && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#60a5fa', flexShrink: 0 }} />}
            </motion.button>
          )
        })}
      </nav>

      {/* Sign out moved to top bar profile dropdown */}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f1f5f9', fontFamily: "'Open Sans', sans-serif" }}>
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
        <div className="vendor-top-bar" style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1.5px solid #f0f0f0', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 12px rgba(0,0,0,0.05)' }}>
          {/* Left: mobile sidebar toggle + page title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="vendor-mobile-menu-btn"
              onClick={() => setSidebarOpen(o => !o)}
              style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>
              <FiMenu size={18} style={{ color: '#374151' }} />
            </button>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
              {NAV_ITEMS.find(n => n.id === section)?.label ?? 'Host Portal'}
            </p>
          </div>

          {/* Right: profile pill + dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => navigate('/home')}
              style={{ padding: '7px 14px', borderRadius: 999, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>
              Browse as Guest
            </motion.button>

            {/* Profile dropdown */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <motion.button
                id="host-profile-btn"
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => setProfileOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 5px', borderRadius: 999, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #093880, #1a56c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: "'Poppins', sans-serif", overflow: 'hidden' }}>
                  {user?.avatar_url ? <img src={user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user?.avatar || user?.name?.charAt(0).toUpperCase())}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name?.split(' ')[0]}</span>
              </motion.button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 220, background: '#fff', borderRadius: 18, boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1.5px solid #f0f0f0', overflow: 'hidden', zIndex: 300 }}>
                    {/* User info header */}
                    <div style={{ padding: '16px 18px', borderBottom: '1px solid #f0f0f0' }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{user?.name}</p>
                      <p style={{ fontSize: 12, color: '#9ca3af' }}>Host Account</p>
                    </div>
                    {/* Nav shortcuts */}
                    {[
                      { label: 'Dashboard', icon: FiHome, action: () => { setSection('dashboard'); setProfileOpen(false) } },
                      { label: 'My Listings', icon: FiList, action: () => { setSection('listings'); setProfileOpen(false) } },
                      { label: 'Bookings', icon: FiCalendar, action: () => { setSection('bookings'); setProfileOpen(false) } },
                      { label: 'Profile', icon: FiUser, action: () => { setSection('profile'); setProfileOpen(false) } },
                    ].map(item => (
                      <button key={item.label} onClick={item.action}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 18px', border: 'none', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151', textAlign: 'left', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <item.icon size={14} style={{ color: '#6b7280' }} /> {item.label}
                      </button>
                    ))}
                    {/* Sign out */}
                    <div style={{ borderTop: '1px solid #f0f0f0', padding: '8px 8px' }}>
                      <button onClick={() => { setProfileOpen(false); handleLogout() }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 10px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#dc2626', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <FiLogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <input type="file" id="host-avatar-upload" style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
            </div>
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
          .vendor-mobile-menu-btn { display: flex !important; }

          .vendor-page-content {
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  )
}
