import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { allListings } from '../data/listings'

const AppDataContext = createContext(null)

const STORAGE_KEYS = {
  wishlist: 'grihastha_wishlist',
  bookings: 'grihastha_bookings',
  notifications: 'grihastha_notifications',
  hostProperties: 'grihastha_host_properties',
  propertyViews: 'grihastha_property_views',
  reviews: 'grihastha_reviews',
  adminUsers: 'grihastha_admin_users',
}

function loadFromStorage(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

// Seed default admin users for demo
const DEFAULT_ADMIN_USERS = [
  { id: 'usr_001', name: 'Priya Sharma', email: 'priya@demo.com', role: 'user', createdAt: '2025-01-15T08:00:00Z', status: 'active' },
  { id: 'usr_002', name: 'Rajan Malla', email: 'rajan@demo.com', role: 'user', createdAt: '2025-02-20T10:30:00Z', status: 'active' },
  { id: 'usr_003', name: 'Anita Thapa', email: 'anita@demo.com', role: 'vendor', createdAt: '2025-03-05T14:00:00Z', status: 'active' },
  { id: 'usr_004', name: 'Bikash Rai', email: 'bikash@demo.com', role: 'user', createdAt: '2025-03-18T09:15:00Z', status: 'active' },
  { id: 'usr_005', name: 'Sunita Gurung', email: 'sunita@demo.com', role: 'vendor', createdAt: '2025-04-02T11:45:00Z', status: 'active' },
]

// Seed mock reviews
const DEFAULT_REVIEWS = {
  1: [
    { id: 'rev_1_1', propertyId: 1, userId: 'priya@demo.com', userName: 'Priya S.', avatar: 'P', rating: 5, comment: 'Absolutely beautiful place! The views were breathtaking and the host was incredibly helpful. Will definitely return.', date: 'March 2025', createdAt: '2025-03-15T10:00:00Z' },
    { id: 'rev_1_2', propertyId: 1, userId: 'rajan@demo.com', userName: 'Rajan M.', avatar: 'R', rating: 4, comment: 'Great value for money. Clean, comfortable and well-located. Minor issue with hot water but host resolved it quickly.', date: 'February 2025', createdAt: '2025-02-20T14:00:00Z' },
    { id: 'rev_1_3', propertyId: 1, userId: 'anita@demo.com', userName: 'Anita T.', avatar: 'A', rating: 5, comment: "One of the best stays in Nepal. The property photos don't do it justice — it's even better in person!", date: 'January 2025', createdAt: '2025-01-10T09:00:00Z' },
  ],
  2: [
    { id: 'rev_2_1', propertyId: 2, userId: 'bikash@demo.com', userName: 'Bikash R.', avatar: 'B', rating: 5, comment: 'The heritage townhouse exceeded all expectations. Waking up to the sounds of the old city was magical.', date: 'April 2025', createdAt: '2025-04-10T10:00:00Z' },
    { id: 'rev_2_2', propertyId: 2, userId: 'sunita@demo.com', userName: 'Sunita G.', avatar: 'S', rating: 4, comment: 'Beautiful property with authentic Newari architecture. Great location for exploring Patan.', date: 'March 2025', createdAt: '2025-03-22T16:00:00Z' },
  ],
  3: [
    { id: 'rev_3_1', propertyId: 3, userId: 'priya@demo.com', userName: 'Priya S.', avatar: 'P', rating: 5, comment: 'The pool villa was absolutely stunning. Worth every rupee. Perfect for a family getaway!', date: 'April 2025', createdAt: '2025-04-05T12:00:00Z' },
  ],
}

export function AppDataProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => loadFromStorage(STORAGE_KEYS.wishlist, []))
  const [bookings, setBookings] = useState(() => loadFromStorage(STORAGE_KEYS.bookings, []))
  const [notifications, setNotifications] = useState(() => loadFromStorage(STORAGE_KEYS.notifications, []))
  const [hostProperties, setHostProperties] = useState(() => loadFromStorage(STORAGE_KEYS.hostProperties, []))
  const [propertyViews, setPropertyViews] = useState(() => loadFromStorage(STORAGE_KEYS.propertyViews, {}))
  const [reviews, setReviews] = useState(() => loadFromStorage(STORAGE_KEYS.reviews, DEFAULT_REVIEWS))
  const [adminUsers, setAdminUsers] = useState(() => loadFromStorage(STORAGE_KEYS.adminUsers, DEFAULT_ADMIN_USERS))
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [priceRange, setPriceRange] = useState([0, 15000])

  // Persist to localStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.wishlist, JSON.stringify(wishlist)) }, [wishlist])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings)) }, [bookings])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications)) }, [notifications])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.hostProperties, JSON.stringify(hostProperties)) }, [hostProperties])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.propertyViews, JSON.stringify(propertyViews)) }, [propertyViews])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviews)) }, [reviews])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.adminUsers, JSON.stringify(adminUsers)) }, [adminUsers])

  // All available properties = static (always approved) + approved host-uploaded
  const allProperties = [
    ...allListings,
    ...hostProperties.filter(p => p.approvalStatus === 'approved' && p.available !== false),
  ]

  // All host properties including pending/rejected (for admin use)
  const allHostPropertiesRaw = hostProperties

  // Filtered properties for user home (only approved)
  const filteredProperties = allProperties.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory
    const matchSearch = !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchPrice = p.price >= priceRange[0] && p.price <= priceRange[1]
    return matchCat && matchSearch && matchPrice
  })

  // Track view
  const trackView = useCallback((propertyId) => {
    setPropertyViews(prev => ({
      ...prev,
      [propertyId]: (prev[propertyId] || 0) + 1,
    }))
  }, [])

  // Wishlist
  const toggleWishlist = useCallback((propertyId) => {
    setWishlist(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    )
  }, [])
  const isWishlisted = useCallback((propertyId) => wishlist.includes(propertyId), [wishlist])

  // Add notification
  const addNotification = useCallback((notification) => {
    const n = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    }
    setNotifications(prev => [n, ...prev])
  }, [])
  const markNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])
  const unreadCount = notifications.filter(n => !n.read).length

  // Book a property
  const createBooking = useCallback(({ propertyId, userId, userEmail, userName, checkIn, checkOut, guests, totalPrice }) => {
    const property = allProperties.find(p => p.id === propertyId)
    if (!property) return { ok: false, error: 'Property not found' }

    const conflict = bookings.find(b =>
      b.propertyId === propertyId &&
      b.status !== 'cancelled' &&
      new Date(b.checkIn) < new Date(checkOut) &&
      new Date(b.checkOut) > new Date(checkIn)
    )
    if (conflict) return { ok: false, error: 'These dates are already booked.' }

    const booking = {
      id: `BK${Date.now()}`,
      propertyId,
      propertyTitle: property.title,
      propertyImage: property.image,
      propertyLocation: property.location,
      userId,
      userEmail,
      userName,
      checkIn,
      checkOut,
      guests,
      totalPrice,
      pricePerNight: property.price,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      hostId: property.hostId,
      reviewed: false,
    }

    setBookings(prev => [booking, ...prev])

    addNotification({
      type: 'booking',
      title: 'Booking Confirmed! 🎉',
      message: `Your stay at "${property.title}" is confirmed for ${checkIn} → ${checkOut}.`,
      propertyId,
    })

    return { ok: true, booking }
  }, [bookings, allProperties, addNotification])

  const cancelBooking = useCallback((bookingId) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
  }, [])

  const getUserBookings = useCallback((userId) => {
    return bookings.filter(b => b.userId === userId)
  }, [bookings])

  const getHostBookings = useCallback((hostId) => {
    return bookings.filter(b => b.hostId === hostId)
  }, [bookings])

  // ─── Reviews & Ratings ──────────────────────────────────────────────────
  const getPropertyReviews = useCallback((propertyId) => {
    return reviews[propertyId] || []
  }, [reviews])

  const getPropertyAverageRating = useCallback((propertyId) => {
    const propReviews = reviews[propertyId] || []
    if (propReviews.length === 0) return null
    const sum = propReviews.reduce((acc, r) => acc + r.rating, 0)
    return (sum / propReviews.length).toFixed(1)
  }, [reviews])

  const hasUserReviewedProperty = useCallback((propertyId, userId) => {
    const propReviews = reviews[propertyId] || []
    return propReviews.some(r => r.userId === userId)
  }, [reviews])

  const canUserReview = useCallback((propertyId, userId) => {
    // User can review only if they have a confirmed booking for this property
    const hasBooking = bookings.some(b =>
      b.propertyId === propertyId &&
      b.userId === userId &&
      b.status === 'confirmed'
    )
    const alreadyReviewed = hasUserReviewedProperty(propertyId, userId)
    return { canReview: hasBooking && !alreadyReviewed, hasBooking, alreadyReviewed }
  }, [bookings, hasUserReviewedProperty])

  const submitReview = useCallback(({ propertyId, userId, userName, avatar, rating, comment }) => {
    const newReview = {
      id: `rev_${propertyId}_${Date.now()}`,
      propertyId,
      userId,
      userName,
      avatar: avatar || userName?.charAt(0)?.toUpperCase() || 'U',
      rating,
      comment,
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      createdAt: new Date().toISOString(),
    }
    setReviews(prev => ({
      ...prev,
      [propertyId]: [...(prev[propertyId] || []), newReview],
    }))
    // Mark booking as reviewed
    setBookings(prev => prev.map(b =>
      b.propertyId === propertyId && b.userId === userId
        ? { ...b, reviewed: true }
        : b
    ))
    return { ok: true, review: newReview }
  }, [])

  // ─── Host CRUD + Approval Flow ──────────────────────────────────────────
  const addHostProperty = useCallback((property, hostId, hostName) => {
    const newProp = {
      ...property,
      id: `hp_${Date.now()}`,
      hostId,
      hostName,
      hostAvatar: hostName?.charAt(0)?.toUpperCase(),
      rating: 0,
      reviews: 0,
      views: 0,
      bookings: 0,
      available: true,
      approvalStatus: 'pending', // 'pending' | 'approved' | 'rejected'
      rejectionReason: null,
      createdAt: new Date().toISOString(),
    }
    setHostProperties(prev => [newProp, ...prev])
    addNotification({
      type: 'listing',
      title: 'Property Submitted! 🏠',
      message: `"${property.title}" has been submitted for admin approval. You'll be notified once reviewed.`,
    })
    return { ok: true, property: newProp }
  }, [addNotification])

  const updateHostProperty = useCallback((propertyId, updates) => {
    setHostProperties(prev => prev.map(p => p.id === propertyId ? { ...p, ...updates } : p))
    return { ok: true }
  }, [])

  const deleteHostProperty = useCallback((propertyId) => {
    setHostProperties(prev => prev.filter(p => p.id !== propertyId))
  }, [])

  const getHostProperties = useCallback((hostId) => {
    return hostProperties.filter(p => p.hostId === hostId)
  }, [hostProperties])

  // ─── Admin Actions ───────────────────────────────────────────────────────
  const adminApproveProperty = useCallback((propertyId) => {
    let propertyTitle = ''
    setHostProperties(prev => prev.map(p => {
      if (p.id === propertyId) {
        propertyTitle = p.title
        return { ...p, approvalStatus: 'approved', rejectionReason: null }
      }
      return p
    }))
    // Add notification for the vendor
    addNotification({
      type: 'approval',
      title: 'Property Approved ✅',
      message: `Your property "${propertyTitle}" has been approved and is now visible to guests!`,
      propertyId,
    })
  }, [addNotification])

  const adminRejectProperty = useCallback((propertyId, reason) => {
    let propertyTitle = ''
    setHostProperties(prev => prev.map(p => {
      if (p.id === propertyId) {
        propertyTitle = p.title
        return { ...p, approvalStatus: 'rejected', rejectionReason: reason || 'Does not meet listing standards.' }
      }
      return p
    }))
    addNotification({
      type: 'rejection',
      title: 'Property Rejected ❌',
      message: `Your property "${propertyTitle}" was not approved. Reason: ${reason || 'Does not meet listing standards.'}`,
      propertyId,
    })
  }, [addNotification])

  // Admin user management
  const adminGetAllUsers = useCallback(() => {
    return adminUsers
  }, [adminUsers])

  const adminRemoveUser = useCallback((userId, reason) => {
    setAdminUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, status: 'removed', removeReason: reason } : u
    ))
  }, [])

  const adminRestoreUser = useCallback((userId) => {
    setAdminUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, status: 'active', removeReason: null } : u
    ))
  }, [])

  // Register new user in admin list when they sign up
  const registerUserInAdmin = useCallback((userData) => {
    const newUser = {
      id: `usr_${Date.now()}`,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      createdAt: new Date().toISOString(),
      status: 'active',
    }
    setAdminUsers(prev => {
      const exists = prev.some(u => u.email === userData.email)
      if (exists) return prev
      return [...prev, newUser]
    })
  }, [])

  // Host analytics
  const getHostAnalytics = useCallback((hostId) => {
    const props = getHostProperties(hostId)
    const hBookings = getHostBookings(hostId)
    const confirmedBookings = hBookings.filter(b => b.status === 'confirmed')
    const totalEarnings = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    const totalListings = props.length
    const totalBookings = confirmedBookings.length

    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const label = d.toLocaleString('default', { month: 'short' })
      const revenue = confirmedBookings
        .filter(b => {
          const bd = new Date(b.createdAt)
          return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear()
        })
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
      const count = confirmedBookings.filter(b => {
        const bd = new Date(b.createdAt)
        return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear()
      }).length
      months.push({ label, revenue, bookings: count })
    }

    const totalAvailableDays = props.length * 30
    const totalBookedDays = confirmedBookings.reduce((sum, b) => {
      const days = Math.max(1, Math.round((new Date(b.checkOut) - new Date(b.checkIn)) / (1000 * 60 * 60 * 24)))
      return sum + days
    }, 0)
    const occupancyRate = totalAvailableDays > 0 ? Math.min(100, Math.round((totalBookedDays / totalAvailableDays) * 100)) : 0

    const propBookingCount = {}
    confirmedBookings.forEach(b => {
      propBookingCount[b.propertyId] = (propBookingCount[b.propertyId] || 0) + 1
    })
    const topPropertyId = Object.entries(propBookingCount).sort((a, b) => b[1] - a[1])[0]?.[0]
    const topProperty = topPropertyId ? allProperties.find(p => String(p.id) === String(topPropertyId)) : null

    return { totalListings, totalBookings, totalEarnings, occupancyRate, monthlyData: months, topProperty, confirmedBookings }
  }, [getHostProperties, getHostBookings, allProperties])

  // Admin system stats
  const getAdminStats = useCallback(() => {
    const totalUsers = adminUsers.filter(u => u.role === 'user' && u.status === 'active').length
    const totalVendors = adminUsers.filter(u => u.role === 'vendor' && u.status === 'active').length
    const pendingProperties = hostProperties.filter(p => p.approvalStatus === 'pending').length
    const approvedProperties = hostProperties.filter(p => p.approvalStatus === 'approved').length
    const rejectedProperties = hostProperties.filter(p => p.approvalStatus === 'rejected').length
    const totalBookingsCount = bookings.length
    const totalRevenue = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    return { totalUsers, totalVendors, pendingProperties, approvedProperties, rejectedProperties, totalBookingsCount, totalRevenue }
  }, [adminUsers, hostProperties, bookings])

  return (
    <AppDataContext.Provider value={{
      // Properties
      allProperties,
      allHostPropertiesRaw,
      filteredProperties,
      trackView,
      // Search / filter
      searchQuery, setSearchQuery,
      activeCategory, setActiveCategory,
      priceRange, setPriceRange,
      // Wishlist
      wishlist, toggleWishlist, isWishlisted,
      // Bookings
      bookings, createBooking, cancelBooking, getUserBookings, getHostBookings,
      // Notifications
      notifications, addNotification, markNotificationsRead, unreadCount,
      // Host
      hostProperties,
      addHostProperty, updateHostProperty, deleteHostProperty, getHostProperties,
      getHostAnalytics,
      // Admin
      adminApproveProperty, adminRejectProperty,
      adminGetAllUsers, adminRemoveUser, adminRestoreUser,
      registerUserInAdmin, getAdminStats,
      // Reviews
      reviews, getPropertyReviews, getPropertyAverageRating,
      hasUserReviewedProperty, canUserReview, submitReview,
    }}>
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider')
  return ctx
}
