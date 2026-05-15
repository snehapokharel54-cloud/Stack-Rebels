import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { allListings } from '../data/listings'
import { listingsAPI, bookingsAPI, wishlistsAPI, reviewsAPI, notificationsAPI, adminAPI, hostAPI } from '../services/api'
import { getToken } from '../services/api'

const AppDataContext = createContext(null)

const STORAGE_KEYS = {
  wishlist: 'grihastha_wishlist',
  bookings: 'grihastha_bookings',
  notifications: 'grihastha_notifications',
  hostProperties: 'grihastha_host_properties',
  propertyViews: 'grihastha_property_views',
  reviews: 'grihastha_reviews',
  adminUsers: 'grihastha_admin_users',
  kycRecords: 'grihastha_kyc_records',
  credits: 'grihastha_credits',
  creditLog: 'grihastha_credit_log',
  auditLog: 'grihastha_audit_log',
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
  const [kycRecords, setKycRecords] = useState(() => loadFromStorage(STORAGE_KEYS.kycRecords, {}))
  const [credits, setCredits] = useState(() => loadFromStorage(STORAGE_KEYS.credits, {}))
  const [creditLog, setCreditLog] = useState(() => loadFromStorage(STORAGE_KEYS.creditLog, []))
  const [auditLog, setAuditLog] = useState(() => loadFromStorage(STORAGE_KEYS.auditLog, []))
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [priceRange, setPriceRange] = useState([0, 15000])
  const [apiListings, setApiListings] = useState([])
  const [listingsLoading, setListingsLoading] = useState(false)
  const [usingAPI, setUsingAPI] = useState(false)
  const fetchedOnce = useRef(false)

  // Persist to localStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.wishlist, JSON.stringify(wishlist)) }, [wishlist])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings)) }, [bookings])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications)) }, [notifications])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.hostProperties, JSON.stringify(hostProperties)) }, [hostProperties])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.propertyViews, JSON.stringify(propertyViews)) }, [propertyViews])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviews)) }, [reviews])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.adminUsers, JSON.stringify(adminUsers)) }, [adminUsers])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.kycRecords, JSON.stringify(kycRecords)) }, [kycRecords])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.credits, JSON.stringify(credits)) }, [credits])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.creditLog, JSON.stringify(creditLog)) }, [creditLog])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.auditLog, JSON.stringify(auditLog)) }, [auditLog])

  // ─── Transform API listing to frontend format ────────────────────────────
  const transformAPIListing = useCallback((apiListing) => {
    const city = apiListing.address?.city || ''
    const province = apiListing.address?.province || apiListing.address?.state || ''
    const location = city && province ? `${city}, ${province}` : city || province || apiListing.location || 'Nepal'
    return {
      id: apiListing.id,
      title: apiListing.title || 'Untitled Property',
      location,
      latitude: apiListing.address?.latitude || null,
      longitude: apiListing.address?.longitude || null,
      category: apiListing.category || apiListing.property_type?.toLowerCase() || 'house',
      price: parseFloat(apiListing.price_per_night) || apiListing.price || 0,
      rating: parseFloat(apiListing.average_rating) || parseFloat(apiListing.avg_rating) || apiListing.rating || 0,
      reviews: parseInt(apiListing.review_count || apiListing.total_reviews || apiListing.reviews || 0),
      image: apiListing.photos?.[0]?.url || apiListing.image || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
      images: apiListing.photos?.map(p => p.url) || apiListing.images || [],
      tag: apiListing.tag || null,
      description: apiListing.description || '',
      amenities: apiListing.amenities || [],
      hostName: apiListing.host_name || apiListing.hostName || 'Host',
      hostAvatar: apiListing.host_avatar || (apiListing.host_name || 'H').charAt(0).toUpperCase(),
      hostId: apiListing.host_id || apiListing.hostId || '',
      maxGuests: apiListing.floor_plan?.guests || apiListing.maxGuests || 4,
      bedrooms: apiListing.floor_plan?.bedrooms || apiListing.bedrooms || 1,
      beds: apiListing.floor_plan?.beds || apiListing.beds || 1,
      bathrooms: apiListing.floor_plan?.bathrooms || apiListing.bathrooms || 1,
      views: apiListing.views || 0,
      bookings: apiListing.bookings || 0,
      lat: apiListing.address?.latitude || apiListing.latitude || apiListing.lat || 27.7172,
      lng: apiListing.address?.longitude || apiListing.longitude || apiListing.lng || apiListing.lon || 85.3240,
      available: apiListing.available !== false,
      approvalStatus: apiListing.status === 'PUBLISHED' ? 'approved' : 'pending',
      instantBook: apiListing.instant_book_enabled || false,
      cleaningFee: parseFloat(apiListing.cleaning_fee) || 0,
      minNights: apiListing.minimum_night_stay || 1,
      _fromAPI: true,
    }
  }, [])

  // ─── Fetch listings from API (with fallback) ─────────────────────────────
  const fetchListingsFromAPI = useCallback(async (params = {}) => {
    setListingsLoading(true)
    try {
      const { data } = await listingsAPI.search(params)
      // Backend returns { listings: [...], pagination: {...} } directly
      const listings = data?.data?.listings || data?.listings || (Array.isArray(data?.data) ? data.data : null)
      if (listings && listings.length > 0) {
        const transformed = listings.map(transformAPIListing)
        setApiListings(transformed)
        setUsingAPI(true)
        console.log(`[AppData] ✅ Loaded ${transformed.length} listings from API`)
        return transformed
      } else if (listings && listings.length === 0) {
        // API works but no listings in DB yet
        setApiListings([])
        setUsingAPI(true)
        console.log('[AppData] ✅ API connected, 0 listings in database')
        return []
      }
    } catch (err) {
      console.warn('[AppData] API listings fetch failed, using mock data:', err.message)
      setUsingAPI(false)
    } finally {
      setListingsLoading(false)
    }
    return []
  }, [transformAPIListing])

  // Attempt to fetch from API on mount
  useEffect(() => {
    if (!fetchedOnce.current) {
      fetchedOnce.current = true
      fetchListingsFromAPI()
    }
  }, [fetchListingsFromAPI])

  // All available properties = API listings (if available) + static fallback + approved host-uploaded
  const allProperties = usingAPI
    ? apiListings // The API already returns all approved/published properties from the database
    : [...allListings, ...hostProperties.filter(p => p.approvalStatus === 'approved' && p.available !== false)]

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

  // Add notification (local + API attempt)
  const addNotification = useCallback((notification) => {
    const n = {
      id: Date.now() + '-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    }
    setNotifications(prev => [n, ...prev])
  }, [])

  const markNotificationsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    try {
      if (getToken()) await notificationsAPI.markAllRead()
    } catch { /* fallback to local */ }
  }, [])

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      if (!getToken()) return
      const { data } = await notificationsAPI.getAll()
      if (data?.success && Array.isArray(data.data)) {
        setNotifications(data.data.map(n => ({
          id: n.id,
          type: n.type || 'info',
          title: n.title || '',
          message: n.message || n.body || '',
          read: n.is_read || false,
          timestamp: n.created_at || new Date().toISOString(),
        })))
      }
    } catch { /* keep local */ }
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  // ─── Bookings (API-first with localStorage fallback) ─────────────────────
  const createBooking = useCallback(async ({ propertyId, userId, userEmail, userName, checkIn, checkOut, guests, totalPrice }) => {
    // Try API first
    if (getToken()) {
      try {
        const property = allProperties.find(p => p.id === propertyId)
        const { data } = await bookingsAPI.create({
          listing_id: propertyId,
          check_in: checkIn,
          check_out: checkOut,
          guests,
          booking_type: property?.instantBook ? 'instant' : 'request',
        })
        if (data?.booking_id || data?.success) {
          // Refresh bookings from API
          fetchGuestBookings(userId)
          return { ok: true, booking: data }
        }
      } catch (err) {
        console.error('[Booking] API create failed:', err.response?.data || err.message)
        return { ok: false, error: err.response?.data?.message || err.message || 'Failed to create booking' }
      }
    }

    // Fallback to localStorage
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
      userId, userEmail, userName,
      checkIn, checkOut, guests, totalPrice,
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

  const cancelBooking = useCallback(async (bookingId) => {
    // Try API first
    if (getToken()) {
      try {
        await bookingsAPI.cancel(bookingId, { reason: 'User cancelled' })
      } catch { /* fallback */ }
    }
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
  }, [])

  // Fetch guest bookings from API
  const fetchGuestBookings = useCallback(async (userId) => {
    if (!getToken()) return
    try {
      const { data } = await bookingsAPI.getGuestBookings()
      if (data?.success && Array.isArray(data.data)) {
        const apiBookings = data.data.map(b => ({
          id: b.id || b.booking_id,
          propertyId: b.listing_id || b.propertyId,
          propertyTitle: b.listing_title || b.propertyTitle || '',
          propertyImage: b.listing_photo || b.listing_image || b.propertyImage || '',
          propertyLocation: b.listing_location || b.propertyLocation || '',
          userId: b.guest_id || b.userId,
          checkIn: b.check_in || b.checkIn,
          checkOut: b.check_out || b.checkOut,
          guests: b.guests || 1,
          totalPrice: b.total_price || b.totalPrice || 0,
          status: b.status ? b.status.toLowerCase() : 'confirmed',
          paymentStatus: b.payment_status ? b.payment_status.toLowerCase() : 'unpaid',
          createdAt: b.created_at || b.createdAt,
          hostId: b.host_id || b.hostId,
          reviewed: b.reviewed || false,
          _fromAPI: true,
        }))
        setBookings(prev => {
          // Keep bookings that belong to OTHER users, 
          // but completely replace this guest's bookings with the fresh API data
          const otherBookings = prev.filter(b => b.userId !== userId && !apiBookings.some(ab => ab.id === b.id))
          return [...otherBookings, ...apiBookings]
        })
      }
    } catch { /* keep local */ }
  }, [])

  const fetchHostBookings = useCallback(async (hostId) => {
    if (!getToken()) return
    try {
      console.log('[AppData] 📅 Calling fetchHostBookings...')
      const { data } = await bookingsAPI.getIncoming()
      console.log('[AppData] 📅 fetchHostBookings response:', data)
      if (data?.success && Array.isArray(data.data)) {
        const apiBookings = data.data.map(b => ({
          id: b.id || b.booking_id,
          propertyId: b.listing_id || b.propertyId,
          propertyTitle: b.listing_title || b.propertyTitle || '',
          propertyImage: b.listing_photo || b.listing_image || b.propertyImage || '',
          propertyLocation: b.listing_location || b.propertyLocation || '',
          userId: b.guest_id || b.userId,
          guestName: b.guest_name,
          checkIn: b.check_in || b.checkIn,
          checkOut: b.check_out || b.checkOut,
          guests: b.guests || 1,
          totalPrice: b.total_price || b.totalPrice || 0,
          status: b.status ? b.status.toLowerCase() : 'confirmed',
          paymentStatus: b.payment_status ? b.payment_status.toLowerCase() : 'unpaid',
          createdAt: b.created_at || b.createdAt,
          hostId: b.host_id || b.hostId,
          reviewed: b.reviewed || false,
          _fromAPI: true,
        }))
        console.log('[AppData] 📅 Mapped host bookings:', apiBookings)
        setBookings(prev => {
          // Keep bookings that belong to OTHER users (guests/other hosts), 
          // but completely replace this host's bookings with the fresh API data
          const otherBookings = prev.filter(b => b.hostId !== hostId && !apiBookings.some(ab => ab.id === b.id))
          return [...otherBookings, ...apiBookings]
        })
      }
    } catch (err) { console.error('[AppData] fetchHostBookings Error:', err) }
  }, [])

  const getUserBookings = useCallback((userId) => {
    console.log('[AppData] getUserBookings called with userId:', userId)
    console.log('[AppData] bookings count:', bookings.length)
    if (bookings.length > 0) {
      console.log('[AppData] first booking userId:', bookings[0].userId)
    }
    return bookings.filter(b => b.userId === userId)
  }, [bookings])

  const getHostBookings = useCallback((hostId) => {
    console.log('[AppData] getHostBookings called with hostId:', hostId)
    console.log('[AppData] Current context bookings:', bookings)
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

  const submitReview = useCallback(async ({ propertyId, userId, userName, avatar, rating, comment, bookingId }) => {
    // Try API first
    if (getToken() && bookingId) {
      try {
        const { data } = await reviewsAPI.submit({ booking_id: bookingId, rating, comment })
        if (data?.success) {
          // Refresh reviews
          fetchPropertyReviews(propertyId)
          return { ok: true, review: data.data }
        }
      } catch (err) {
        console.warn('[Review] API submit failed:', err.response?.data?.message || err.message)
      }
    }
    // Fallback to localStorage
    const newReview = {
      id: `rev_${propertyId}_${Date.now()}`,
      propertyId, userId, userName,
      avatar: avatar || userName?.charAt(0)?.toUpperCase() || 'U',
      rating, comment,
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      createdAt: new Date().toISOString(),
    }
    setReviews(prev => ({
      ...prev,
      [propertyId]: [...(prev[propertyId] || []), newReview],
    }))
    setBookings(prev => prev.map(b =>
      b.propertyId === propertyId && b.userId === userId
        ? { ...b, reviewed: true }
        : b
    ))
    return { ok: true, review: newReview }
  }, [])

  // Fetch reviews for a property from API
  const fetchPropertyReviews = useCallback(async (propertyId) => {
    try {
      const { data } = await reviewsAPI.getForListing(propertyId)
      if (data?.success && Array.isArray(data.data)) {
        setReviews(prev => ({
          ...prev,
          [propertyId]: data.data.map(r => ({
            id: r.id,
            propertyId,
            userId: r.guest_id || r.userId,
            userName: r.guest_name || r.userName || 'Guest',
            avatar: (r.guest_name || 'G').charAt(0).toUpperCase(),
            rating: r.rating,
            comment: r.comment || '',
            reply: r.reply || null,
            date: new Date(r.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            createdAt: r.created_at,
          })),
        }))
      }
    } catch { /* keep local */ }
  }, [])

  // ─── Admin: Delete a review ──────────────────────────────────────────────
  const setReviewsAdmin = useCallback((propertyId, reviewId) => {
    setReviews(prev => ({
      ...prev,
      [propertyId]: (prev[propertyId] || []).filter(r => r.id !== reviewId),
    }))
  }, [])

  // ─── Audit Log ───────────────────────────────────────────────────────────
  const addAuditLog = useCallback((entry) => {
    const log = { id: `al_${Date.now()}`, timestamp: new Date().toISOString(), ...entry }
    setAuditLog(prev => [log, ...prev.slice(0, 199)])
  }, [])

  // ─── KYC ─────────────────────────────────────────────────────────────────
  const getUserKYC = useCallback((email) => kycRecords[email] || { status: 'not_submitted' }, [kycRecords])

  const submitKYC = useCallback(({ email, ...docNames }) => {
    setKycRecords(prev => ({
      ...prev,
      [email]: { status: 'pending', submittedAt: new Date().toISOString(), ...docNames, rejectionReason: null },
    }))
  }, [])

  const adminApproveKYC = useCallback((email) => {
    setKycRecords(prev => ({ ...prev, [email]: { ...prev[email], status: 'verified', reviewedAt: new Date().toISOString() } }))
    addAuditLog({ action: 'KYC Approved', targetEmail: email, details: 'Identity verified' })
  }, [addAuditLog])

  const adminRejectKYC = useCallback((email, reason) => {
    setKycRecords(prev => ({ ...prev, [email]: { ...prev[email], status: 'rejected', rejectionReason: reason, reviewedAt: new Date().toISOString() } }))
    addAuditLog({ action: 'KYC Rejected', targetEmail: email, details: reason })
  }, [addAuditLog])

  const getAllKYCRecords = useCallback(() => kycRecords, [kycRecords])

  // ─── Credits ─────────────────────────────────────────────────────────────
  const getUserCredits = useCallback((email) => credits[email] || 0, [credits])

  const adminAdjustCredits = useCallback((targetEmail, amount, reason, adminName) => {
    setCredits(prev => ({ ...prev, [targetEmail]: Math.max(0, (prev[targetEmail] || 0) + amount) }))
    const entry = { id: `cr_${Date.now()}`, date: new Date().toISOString(), admin: adminName || 'Admin', userEmail: targetEmail, amount, reason }
    setCreditLog(prev => [entry, ...prev])
    addAuditLog({ action: amount > 0 ? 'Credits Added' : 'Credits Deducted', targetEmail, details: `${Math.abs(amount)} credits — ${reason}` })
  }, [credits, addAuditLog])

  // ─── Admin role management ────────────────────────────────────────────────
  const adminChangeRole = useCallback((userId, newRole, adminName) => {
    setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    const user = adminUsers.find(u => u.id === userId)
    addAuditLog({ action: 'Role Changed', targetEmail: user?.email || userId, details: `Role changed to ${newRole}` })
  }, [adminUsers, addAuditLog])

  const adminSuspendUser = useCallback((userId, reason, duration, adminName) => {
    setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'suspended', suspendReason: reason, suspendDuration: duration } : u))
    const user = adminUsers.find(u => u.id === userId)
    addAuditLog({ action: 'User Suspended', targetEmail: user?.email || userId, details: `${reason} (${duration})` })
  }, [adminUsers, addAuditLog])

  const adminUnsuspendUser = useCallback((userId) => {
    setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active', suspendReason: null, suspendDuration: null } : u))
    const user = adminUsers.find(u => u.id === userId)
    addAuditLog({ action: 'User Unsuspended', targetEmail: user?.email || userId, details: 'Account restored' })
  }, [adminUsers, addAuditLog])

  // ─── Host CRUD + Approval Flow (API-first with fallback) ────────────────
  const addHostProperty = useCallback(async (property, hostId, hostName) => {
    // Try API: create a listing draft then update it
    if (getToken()) {
      try {
        const { data: createData } = await listingsAPI.create()
        if (createData?.success && (createData?.data?.id || createData?.data?.listing_id)) {
          const listingId = createData.data.id || createData.data.listing_id
          // Update with property details
          await listingsAPI.update(listingId, {
            title: property.title,
            description: property.description,
            property_type: property.category?.toUpperCase() || 'HOUSE',
            address: {
              street: property.location || '',
              city: property.city || property.location?.split(',')[0]?.trim() || '',
              district: property.district || '',
              zip_code: property.zipCode || '',
              latitude: property.latitude || null,
              longitude: property.longitude || null,
              legal_doc_url: property.legalDocUrl || '',
            },
            price_per_night: property.price || 0,
            amenities: property.amenities || [],
            floor_plan: {
              bedrooms: property.bedrooms || 1,
              bathrooms: property.bathrooms || 1,
              guests: property.maxGuests || 4,
            },
            photos: property.images?.map(url => ({ url })) || [],
          })
          // Publish
          // try { await listingsAPI.publish(listingId) } catch { /* draft mode */ }

          addNotification({
            type: 'listing',
            title: 'Property Submitted! 🏠',
            message: `"${property.title}" has been submitted. You'll be notified once reviewed.`,
          })
          return { ok: true, property: { id: listingId, ...property } }
        }
      } catch (err) {
        console.warn('[Host] API create failed, using local:', err.message)
      }
    }
    // Fallback to localStorage
    const newProp = {
      ...property,
      id: `hp_${Date.now()}`,
      hostId, hostName,
      hostAvatar: hostName?.charAt(0)?.toUpperCase(),
      rating: 0, reviews: 0, views: 0, bookings: 0,
      available: true,
      approvalStatus: 'pending',
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

  const updateHostProperty = useCallback(async (propertyId, updates) => {
    if (getToken()) {
      try {
        await listingsAPI.update(propertyId, updates)
      } catch { /* fallback */ }
    }
    setHostProperties(prev => prev.map(p => p.id === propertyId ? { ...p, ...updates } : p))
    return { ok: true }
  }, [])

  const deleteHostProperty = useCallback(async (propertyId) => {
    if (typeof propertyId === 'string' && propertyId.startsWith('hp_')) {
      setHostProperties(prev => prev.filter(p => p.id !== propertyId))
      return
    }
    if (getToken()) {
      try {
        await listingsAPI.delete(propertyId)
      } catch { /* fallback */ }
    }
    setHostProperties(prev => prev.filter(p => p.id !== propertyId))
  }, [])

  const getHostProperties = useCallback((hostId) => {
    return hostProperties
  }, [hostProperties])

  // Fetch host listings from API
  const fetchHostListings = useCallback(async () => {
    if (!getToken()) return
    try {
      console.log('[AppData] 🏠 Calling fetchHostListings...')
      const { data } = await listingsAPI.getMyListings()
      console.log('[AppData] 🏠 fetchHostListings response:', data)
      if (data?.success && data?.data?.listings) {
        const transformed = data.data.listings.map(l => transformAPIListing(l))
        setHostProperties(transformed)
      }
    } catch { /* keep local */ }
  }, [transformAPIListing])

  const fetchAdminListings = useCallback(async () => {
    if (!getToken()) return
    try {
      const { data } = await listingsAPI.getListingsAdmin()
      if (data?.success && Array.isArray(data.data)) {
        const transformed = data.data.map(l => transformAPIListing(l))
        setHostProperties(transformed)
      }
    } catch (err) {
      console.error('Failed to fetch admin listings:', err)
    }
  }, [transformAPIListing])
  const adminApproveProperty = useCallback(async (propertyId) => {
    let propertyTitle = ''
    try {
      // Call API to publish the listing
      await adminAPI.approveListing(propertyId)
      
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
    } catch (err) {
      console.error('Failed to approve property:', err)
    }
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
    const totalEarnings = confirmedBookings.reduce((sum, b) => sum + parseFloat(b.totalPrice || 0), 0)
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
        .reduce((sum, b) => sum + parseFloat(b.totalPrice || 0), 0)
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
      .reduce((sum, b) => sum + parseFloat(b.totalPrice || 0), 0)
    const totalReviews = Object.values(reviews).reduce((sum, arr) => sum + (arr?.length || 0), 0)
    return { totalUsers, totalVendors, pendingProperties, approvedProperties, rejectedProperties, totalBookingsCount, totalRevenue, totalReviews }
  }, [adminUsers, hostProperties, bookings, reviews])

  return (
    <AppDataContext.Provider value={{
      // Properties
      allProperties,
      allHostPropertiesRaw,
      filteredProperties,
      trackView,
      // API state
      fetchListingsFromAPI, listingsLoading, usingAPI,
      fetchGuestBookings, fetchHostBookings, fetchNotifications, fetchHostListings, fetchAdminListings, fetchPropertyReviews,
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
      adminChangeRole, adminSuspendUser, adminUnsuspendUser,
      registerUserInAdmin, getAdminStats,
      // Reviews
      reviews, getPropertyReviews, getPropertyAverageRating,
      hasUserReviewedProperty, canUserReview, submitReview, setReviewsAdmin,
      // KYC
      kycRecords, getUserKYC, submitKYC, adminApproveKYC, adminRejectKYC, getAllKYCRecords,
      // Credits
      credits, getUserCredits, adminAdjustCredits, creditLog,
      // Audit
      auditLog, addAuditLog,
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
