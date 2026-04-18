/**
 * context/AppDataContext.jsx — Live API data context for Grihastha
 *
 * All CRUD operations hit the backend REST API instead of localStorage.
 * Provides listings search, bookings, wishlists, reviews, notifications.
 */
import { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api'

const AppDataContext = createContext(null)

export function AppDataProvider({ children }) {
  // ── Listings state (API-driven) ─────────────────────────────
  const [listings, setListings] = useState([])
  const [listingsLoading, setListingsLoading] = useState(false)
  const [pagination, setPagination] = useState({ total: 0, hasMore: false })
  const [searchParams, setSearchParams] = useState({
    location: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    checkIn: '',
    checkOut: '',
    adults: '',
    sortBy: 'newest',
  })

  // ── Bookings state ──────────────────────────────────────────
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)

  // ── Wishlists state ─────────────────────────────────────────
  const [wishlists, setWishlists] = useState([])
  const [wishlistsLoading, setWishlistsLoading] = useState(false)

  // ── Notifications state ─────────────────────────────────────
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // ═══════════════════════════════════════════════════════════
  // LISTINGS
  // ═══════════════════════════════════════════════════════════

  /** Search published listings */
  const searchListings = useCallback(async (params = {}) => {
    setListingsLoading(true)
    try {
      const query = {
        location: params.location || searchParams.location || undefined,
        category: params.category && params.category !== 'all' ? params.category : undefined,
        minPrice: params.minPrice || searchParams.minPrice || undefined,
        maxPrice: params.maxPrice || searchParams.maxPrice || undefined,
        checkIn: params.checkIn || searchParams.checkIn || undefined,
        checkOut: params.checkOut || searchParams.checkOut || undefined,
        adults: params.adults || searchParams.adults || undefined,
        sortBy: params.sortBy || searchParams.sortBy || undefined,
        limit: params.limit || 20,
        offset: params.offset || 0,
      }
      const res = await api.get('/listings/search', query)
      if (res.success) {
        setListings(res.data || [])
        setPagination(res.pagination || { total: 0, hasMore: false })
      }
      return res
    } finally {
      setListingsLoading(false)
    }
  }, [searchParams])

  /** Get single listing by ID */
  const getListingById = useCallback(async (id) => {
    const res = await api.get(`/listings/${id}`)
    if (res.success) return { ok: true, data: res.data }
    return { ok: false, error: res.message }
  }, [])

  /** Update search params and re-search */
  const updateSearchParams = useCallback((updates) => {
    setSearchParams((prev) => ({ ...prev, ...updates }))
  }, [])

  // ── Host Listing CRUD ───────────────────────────────────────

  /** Create blank draft listing */
  const createListing = useCallback(async () => {
    const res = await api.post('/listings')
    if (res.success) return { ok: true, data: res.data || res }
    return { ok: false, error: res.message }
  }, [])

  /** Update listing (multi-step) */
  const updateListing = useCallback(async (id, data) => {
    const res = await api.patch(`/listings/${id}`, data)
    return res.success ? { ok: true, data: res.data } : { ok: false, error: res.message }
  }, [])

  /** Upload photos to listing */
  const uploadPhotos = useCallback(async (id, files) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('photos', file))
    const res = await api.upload(`/listings/${id}/photos`, formData)
    return res.success ? { ok: true, data: res.data } : { ok: false, error: res.message }
  }, [])

  /** Publish listing */
  const publishListing = useCallback(async (id) => {
    const res = await api.post(`/listings/${id}/publish`)
    return res.success ? { ok: true } : { ok: false, error: res.message }
  }, [])

  /** Delete listing */
  const deleteListing = useCallback(async (id) => {
    const res = await api.delete(`/listings/${id}`)
    return res.success ? { ok: true } : { ok: false, error: res.message }
  }, [])

  /** Get host's own listings */
  const getMyListings = useCallback(async (status) => {
    const res = await api.get('/listings/host/my-listings', status ? { status } : {})
    return res.success ? { ok: true, data: res.data || res } : { ok: false, error: res.message }
  }, [])

  /** Update listing pricing */
  const updateListingPricing = useCallback(async (id, pricingData) => {
    const res = await api.patch(`/listings/${id}/pricing`, pricingData)
    return res.success ? { ok: true } : { ok: false, error: res.message }
  }, [])

  // ═══════════════════════════════════════════════════════════
  // BOOKINGS
  // ═══════════════════════════════════════════════════════════

  /** Create a booking */
  const createBooking = useCallback(async ({ listing_id, check_in, check_out, guests, booking_type, special_requests }) => {
    const res = await api.post('/bookings', {
      listing_id,
      check_in,
      check_out,
      guests,
      booking_type: booking_type || 'instant',
      special_requests,
    })
    if (res.success) return { ok: true, data: res }
    return { ok: false, error: res.message, status: res.status }
  }, [])

  /** Get guest bookings */
  const getUserBookings = useCallback(async (status, limit = 20, offset = 0) => {
    setBookingsLoading(true)
    try {
      const res = await api.get('/bookings', { status, limit, offset })
      if (res.success) {
        setBookings(res.data || res.bookings || [])
      }
      return res
    } finally {
      setBookingsLoading(false)
    }
  }, [])

  /** Get single booking detail */
  const getBookingById = useCallback(async (id) => {
    const res = await api.get(`/bookings/${id}`)
    return res.success ? { ok: true, data: res.data } : { ok: false, error: res.message }
  }, [])

  /** Cancel booking (guest) */
  const cancelBooking = useCallback(async (id, reason) => {
    const res = await api.patch(`/bookings/${id}/cancel`, reason ? { reason } : {})
    return res.success ? { ok: true } : { ok: false, error: res.message }
  }, [])

  /** Get host incoming bookings */
  const getHostBookings = useCallback(async (status, limit = 20) => {
    const res = await api.get('/bookings/host/incoming', { status, limit })
    return res.success ? { ok: true, data: res.data || [] } : { ok: false, error: res.message }
  }, [])

  /** Accept booking (host) */
  const acceptBooking = useCallback(async (id) => {
    const res = await api.patch(`/bookings/${id}/accept`)
    return res.success ? { ok: true } : { ok: false, error: res.message }
  }, [])

  /** Decline booking (host) */
  const declineBooking = useCallback(async (id, reason) => {
    const res = await api.patch(`/bookings/${id}/decline`, reason ? { reason } : {})
    return res.success ? { ok: true } : { ok: false, error: res.message }
  }, [])

  /** Price breakdown */
  const getBookingPriceBreakdown = useCallback(async (id) => {
    const res = await api.get(`/bookings/${id}/price-breakdown`)
    return res.success ? { ok: true, data: res.data } : { ok: false, error: res.message }
  }, [])

  // ═══════════════════════════════════════════════════════════
  // WISHLISTS
  // ═══════════════════════════════════════════════════════════

  /** Fetch all wishlists */
  const fetchWishlists = useCallback(async () => {
    setWishlistsLoading(true)
    try {
      const res = await api.get('/wishlists')
      if (res.success) {
        setWishlists(res.data || [])
      }
      return res
    } finally {
      setWishlistsLoading(false)
    }
  }, [])

  /** Create a new wishlist */
  const createWishlist = useCallback(async (name) => {
    const res = await api.post('/wishlists', { name })
    if (res.success) await fetchWishlists()
    return res.success ? { ok: true, data: res.data } : { ok: false, error: res.message }
  }, [fetchWishlists])

  /** Delete a wishlist */
  const deleteWishlist = useCallback(async (id) => {
    const res = await api.delete(`/wishlists/${id}`)
    if (res.success) await fetchWishlists()
    return res.success ? { ok: true } : { ok: false, error: res.message }
  }, [fetchWishlists])

  /** Add listing to wishlist */
  const addToWishlist = useCallback(async (wishlistId, listingId) => {
    const res = await api.post(`/wishlists/${wishlistId}/listings/${listingId}`)
    if (res.success) await fetchWishlists()
    return res.success ? { ok: true } : { ok: false, error: res.message }
  }, [fetchWishlists])

  /** Remove listing from wishlist */
  const removeFromWishlist = useCallback(async (wishlistId, listingId) => {
    const res = await api.delete(`/wishlists/${wishlistId}/listings/${listingId}`)
    if (res.success) await fetchWishlists()
    return res.success ? { ok: true } : { ok: false, error: res.message }
  }, [fetchWishlists])

  // ═══════════════════════════════════════════════════════════
  // REVIEWS
  // ═══════════════════════════════════════════════════════════

  /** Get reviews for a listing */
  const getListingReviews = useCallback(async (listingId, limit = 10, offset = 0) => {
    const res = await api.get(`/reviews/listings/${listingId}`, { limit, offset })
    return res.success ? { ok: true, data: res.data, averages: res.averages } : { ok: false, error: res.message }
  }, [])

  /** Submit a review */
  const submitReview = useCallback(async (reviewData) => {
    const res = await api.post('/reviews', reviewData)
    return res.success ? { ok: true } : { ok: false, error: res.message }
  }, [])

  /** Get reviews received by host */
  const getHostReviews = useCallback(async () => {
    const res = await api.get('/reviews/received')
    return res.success ? { ok: true, data: res.data || [] } : { ok: false, error: res.message }
  }, [])

  /** Reply to a review */
  const replyToReview = useCallback(async (id, reply) => {
    const res = await api.post(`/reviews/${id}/reply`, { reply })
    return res.success ? { ok: true } : { ok: false, error: res.message }
  }, [])

  // ═══════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════

  /** Fetch notifications */
  const fetchNotifications = useCallback(async (unread_only = false) => {
    setNotificationsLoading(true)
    try {
      const res = await api.get('/notifications', { unread_only })
      if (res.success) {
        const notifs = res.data || []
        setNotifications(notifs)
        setUnreadCount(notifs.filter((n) => !n.is_read).length)
      }
      return res
    } finally {
      setNotificationsLoading(false)
    }
  }, [])

  /** Mark all read */
  const markNotificationsRead = useCallback(async () => {
    const res = await api.patch('/notifications/read-all')
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    }
    return res
  }, [])

  /** Mark single read */
  const markNotificationRead = useCallback(async (id) => {
    const res = await api.patch(`/notifications/${id}/read`)
    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    return res
  }, [])

  // ═══════════════════════════════════════════════════════════
  // HOST DASHBOARD / FINANCES
  // ═══════════════════════════════════════════════════════════

  /** Get host earnings */
  const getHostEarnings = useCallback(async () => {
    const res = await api.get('/host/earnings')
    return res.success ? { ok: true, data: res.data } : { ok: false, error: res.message }
  }, [])

  /** Get host dashboard data */
  const getHostDashboard = useCallback(async () => {
    const res = await api.get('/host/dashboard')
    return res.success ? { ok: true, data: res.data } : { ok: false, error: res.message }
  }, [])

  // ═══════════════════════════════════════════════════════════
  // PAYMENTS
  // ═══════════════════════════════════════════════════════════

  /** Create Stripe payment intent */
  const createStripeIntent = useCallback(async (bookingId) => {
    const res = await api.post('/payments/create-intent', { booking_id: bookingId })
    return res.success ? { ok: true, ...res } : { ok: false, error: res.message }
  }, [])

  /** Verify Stripe payment */
  const verifyStripePayment = useCallback(async (bookingId, paymentIntentId, sessionId) => {
    const res = await api.post('/payments/verify', {
      booking_id: bookingId,
      payment_intent_id: paymentIntentId,
      session_id: sessionId,
    })
    return res.success ? { ok: true } : { ok: false, error: res.message }
  }, [])

  /** Create Khalti payment intent */
  const createKhaltiIntent = useCallback(async (bookingId) => {
    const res = await api.post('/payments/khalti/create-intent', { booking_id: bookingId })
    return res.success
      ? { ok: true, payment_url: res.payment_url, pidx: res.pidx, amount: res.amount }
      : { ok: false, error: res.message }
  }, [])

  /** Verify Khalti payment */
  const verifyKhaltiPayment = useCallback(async (bookingId, pidx) => {
    const res = await api.post('/payments/khalti/verify', {
      booking_id: bookingId,
      pidx,
    })
    return res.success ? { ok: true } : { ok: false, error: res.message }
  }, [])

  /** Get payment history */
  const getPaymentHistory = useCallback(async () => {
    const res = await api.get('/payments/history')
    return res.success ? { ok: true, data: res.data || [] } : { ok: false, error: res.message }
  }, [])

  // ═══════════════════════════════════════════════════════════
  // CONVERSATIONS
  // ═══════════════════════════════════════════════════════════

  const getConversations = useCallback(async () => {
    const res = await api.get('/conversations')
    return res.success ? { ok: true, data: res.data || [] } : { ok: false, error: res.message }
  }, [])

  const startConversation = useCallback(async ({ host_id, listing_id, message }) => {
    const res = await api.post('/conversations', { host_id, listing_id, message })
    return res.success ? { ok: true, data: res.data } : { ok: false, error: res.message }
  }, [])

  const getMessages = useCallback(async (conversationId) => {
    const res = await api.get(`/conversations/${conversationId}/messages`)
    return res.success ? { ok: true, data: res.data || [] } : { ok: false, error: res.message }
  }, [])

  const sendMessage = useCallback(async (conversationId, body) => {
    const res = await api.post(`/conversations/${conversationId}/messages`, { body })
    return res.success ? { ok: true, data: res.data } : { ok: false, error: res.message }
  }, [])

  return (
    <AppDataContext.Provider
      value={{
        // Listings
        listings,
        listingsLoading,
        pagination,
        searchParams,
        updateSearchParams,
        searchListings,
        getListingById,
        createListing,
        updateListing,
        uploadPhotos,
        publishListing,
        deleteListing,
        getMyListings,
        updateListingPricing,

        // Bookings
        bookings,
        bookingsLoading,
        createBooking,
        getUserBookings,
        getBookingById,
        cancelBooking,
        getHostBookings,
        acceptBooking,
        declineBooking,
        getBookingPriceBreakdown,

        // Wishlists
        wishlists,
        wishlistsLoading,
        fetchWishlists,
        createWishlist,
        deleteWishlist,
        addToWishlist,
        removeFromWishlist,

        // Reviews
        getListingReviews,
        submitReview,
        getHostReviews,
        replyToReview,

        // Notifications
        notifications,
        notificationsLoading,
        unreadCount,
        fetchNotifications,
        markNotificationsRead,
        markNotificationRead,

        // Host
        getHostEarnings,
        getHostDashboard,

        // Payments
        createStripeIntent,
        verifyStripePayment,
        createKhaltiIntent,
        verifyKhaltiPayment,
        getPaymentHistory,

        // Conversations
        getConversations,
        startConversation,
        getMessages,
        sendMessage,
      }}
    >
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider')
  return ctx
}
