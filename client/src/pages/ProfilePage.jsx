import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiUser, FiMail, FiPhone, FiCamera, FiCheck, FiArrowLeft } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { userAPI, mediaAPI } from '../services/api'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data } = await userAPI.getProfile()
        if (data?.success) {
          const u = data.data
          setFullName(u.full_name || '')
          setPhone(u.phone || '')
          setAvatarUrl(u.avatar_url || '')
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
        showToast('Failed to load profile data.', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [showToast])

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype || file.type)) {
      showToast('Only JPEG, PNG and WebP images are allowed.', 'warning')
      return
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB.', 'warning')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await mediaAPI.upload(formData)
      if (data?.success) {
        setAvatarUrl(data.data.url)
        showToast('Avatar uploaded successfully! Save profile to apply.', 'success')
      }
    } catch (err) {
      console.error('Failed to upload avatar:', err)
      showToast('Failed to upload image.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data } = await userAPI.updateProfile({
        full_name: fullName,
        phone: phone,
        avatar_url: avatarUrl
      })

      if (data?.success) {
        showToast('Profile updated successfully!', 'success')
        // Update local auth context if needed
        if (user) {
          updateUser({
            name: fullName,
            avatar: avatarUrl || fullName.charAt(0).toUpperCase(),
            avatar_url: avatarUrl
          })
        }
      }
    } catch (err) {
      console.error('Failed to update profile:', err)
      showToast('Failed to update profile.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 68px)' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#093880', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Open Sans', sans-serif" }}>
      <Navbar />
      
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px' }}>
        {/* Back button */}
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, fontWeight: 600, marginBottom: 24, padding: 0 }}>
          <FiArrowLeft size={16} /> Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100 }}
          style={{
            background: '#fff',
            borderRadius: 24,
            border: '1.5px solid #e5e7eb',
            padding: '40px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
          }}
        >
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 24, color: '#0f172a', marginBottom: 6, marginTop: 0 }}>Account Profile</h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 32 }}>Update your personal information and profile picture</p>

          <form onSubmit={handleSave}>
            {/* Avatar Upload */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 100, height: 100, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #093880, #1a56c4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: 36, fontFamily: "'Poppins', sans-serif",
                  overflow: 'hidden', boxShadow: '0 4px 14px rgba(9,56,128,0.2)'
                }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    fullName.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <label htmlFor="avatar-upload" style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#fff', border: '1.5px solid #e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#093880'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  <FiCamera size={14} style={{ color: '#093880' }} />
                  <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </label>
              </div>
              {uploading && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>Uploading...</p>}
            </div>

            {/* Full Name */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <FiUser size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="John Doe"
                  style={{
                    width: '100%', padding: '14px 16px 14px 44px', borderRadius: 12,
                    border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111827',
                    background: '#fafafa', outline: 'none',
                    transition: 'all 0.2s', boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#093880'; e.target.style.background = '#fff' }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa' }}
                />
              </div>
            </div>

            {/* Email (Read Only) */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <FiMail size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  style={{
                    width: '100%', padding: '14px 16px 14px 44px', borderRadius: 12,
                    border: '1.5px solid #e5e7eb', fontSize: 14, color: '#9ca3af',
                    background: '#f3f4f6', cursor: 'not-allowed', boxSizing: 'border-box'
                  }}
                />
              </div>
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Email cannot be changed.</p>
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <FiPhone size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+977 98XXXXXXXX"
                  style={{
                    width: '100%', padding: '14px 16px 14px 44px', borderRadius: 12,
                    border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111827',
                    background: '#fafafa', outline: 'none',
                    transition: 'all 0.2s', boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#093880'; e.target.style.background = '#fff' }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa' }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={saving || uploading}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '15px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #093880, #1a56c4)',
                color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
                boxShadow: '0 4px 16px rgba(9,56,128,0.25)',
                transition: 'all 0.2s', opacity: saving || uploading ? 0.8 : 1
              }}
            >
              {saving ? 'Saving...' : <><FiCheck size={16} /> Save Profile</>}
            </motion.button>
          </form>
        </motion.div>
      </main>
    </div>
  )
}
