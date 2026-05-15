import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── JWT Token Management ─────────────────────────────────────────────────────
const TOKEN_KEY = 'grihastha_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

// ─── Request Interceptor — Attach JWT ─────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response Interceptor — Handle 401 ────────────────────────────────────────
let onUnauthorized = null
export const setUnauthorizedHandler = (handler) => { onUnauthorized = handler }

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized()
    }
    return Promise.reject(error)
  }
)

// ═══════════════════════════════════════════════════════════════════════════════
//  AUTH API
// ═══════════════════════════════════════════════════════════════════════════════

export const authAPI = {
  // ─── User Auth ────────────────────────────────────────────────────────────
  userSignup: (data) => api.post('/v1/auth/user/signup', data),
  userLogin: (data) => api.post('/v1/auth/user/login', data),
  userVerifyEmail: (data) => api.post('/v1/auth/user/verify-email', data),
  userSignupComplete: (data) => api.post('/v1/auth/user/signup-complete', data),
  userForgotPassword: (data) => api.post('/v1/auth/user/forgot-password', data),
  userResetPassword: (data) => api.post('/v1/auth/user/reset-password', data),

  // ─── Host Auth ────────────────────────────────────────────────────────────
  hostSignup: (data) => api.post('/v1/auth/host/signup', data),
  hostLogin: (data) => api.post('/v1/auth/host/login', data),
  hostVerifyEmail: (data) => api.post('/v1/auth/host/verify-email', data),
  hostSignupComplete: (data) => api.post('/v1/auth/host/signup-complete', data),
  hostForgotPassword: (data) => api.post('/v1/auth/host/forgot-password', data),
  hostResetPassword: (data) => api.post('/v1/auth/host/reset-password', data),

  // ─── Admin Auth ───────────────────────────────────────────────────────────
  adminLogin: (data) => api.post('/v1/auth/admin/login', data),

  // ─── Social Auth ──────────────────────────────────────────────────────────
  googleAuth: (data) => api.post('/v1/auth/social/google', data),
}

// ═══════════════════════════════════════════════════════════════════════════════
//  USER PROFILE API
// ═══════════════════════════════════════════════════════════════════════════════

export const userAPI = {
  getProfile: () => api.get('/v1/users/me'),
  updateProfile: (data) => api.patch('/v1/users/me', data),
  getHostProfile: (hostId) => api.get(`/v1/users/hosts/${hostId}/profile`),
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LISTINGS API
// ═══════════════════════════════════════════════════════════════════════════════

export const listingsAPI = {
  // Public
  search: (params) => api.get('/v1/listings/search', { params }),
  getById: (id) => api.get(`/v1/listings/${id}`),

  // Host CRUD
  create: () => api.post('/v1/listings'),
  update: (id, data) => api.patch(`/v1/listings/${id}`, data),
  delete: (id) => api.delete(`/v1/listings/${id}`),
  publish: (id) => api.post(`/v1/listings/${id}/publish`),
  uploadPhotos: (id, formData) => api.post(`/v1/listings/${id}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMyListings: (params) => api.get('/v1/listings/host/my-listings', { params }),
  getListingsAdmin: () => api.get('/v1/admin/listings'),

  // Pricing & config
  updatePricing: (id, data) => api.patch(`/v1/listings/${id}/pricing`, data),
  createPromotion: (id, data) => api.post(`/v1/listings/${id}/promotions`, data),
  getCalendar: (id, params) => api.get(`/v1/listings/${id}/calendar`, { params }),
  blockDates: (id, data) => api.post(`/v1/listings/${id}/availability/block`, data),
}

// ═══════════════════════════════════════════════════════════════════════════════
//  BOOKINGS API
// ═══════════════════════════════════════════════════════════════════════════════

export const bookingsAPI = {
  create: (data) => api.post('/v1/bookings', data),
  getGuestBookings: (params) => api.get('/v1/bookings', { params }),
  getById: (id) => api.get(`/v1/bookings/${id}`),
  cancel: (id, data) => api.patch(`/v1/bookings/${id}/cancel`, data),
  getPriceBreakdown: (id) => api.get(`/v1/bookings/${id}/price-breakdown`),

  // Host
  getIncoming: (params) => api.get('/v1/bookings/host/incoming', { params }),
  accept: (id) => api.patch(`/v1/bookings/${id}/accept`),
  decline: (id, data) => api.patch(`/v1/bookings/${id}/decline`, data),
  hostCancel: (id, data) => api.patch(`/v1/bookings/${id}/host-cancel`, data),
}

// ═══════════════════════════════════════════════════════════════════════════════
//  WISHLISTS API
// ═══════════════════════════════════════════════════════════════════════════════

export const wishlistsAPI = {
  getAll: () => api.get('/v1/wishlists'),
  create: (data) => api.post('/v1/wishlists', data),
  delete: (id) => api.delete(`/v1/wishlists/${id}`),
  addListing: (wishlistId, listingId) => api.post(`/v1/wishlists/${wishlistId}/listings/${listingId}`),
  removeListing: (wishlistId, listingId) => api.delete(`/v1/wishlists/${wishlistId}/listings/${listingId}`),
}

// ═══════════════════════════════════════════════════════════════════════════════
//  REVIEWS API
// ═══════════════════════════════════════════════════════════════════════════════

export const reviewsAPI = {
  submit: (data) => api.post('/v1/reviews', data),
  getForListing: (listingId, params) => api.get(`/v1/reviews/listings/${listingId}`, { params }),
  getReceived: () => api.get('/v1/reviews/received'),
  reply: (reviewId, data) => api.post(`/v1/reviews/${reviewId}/reply`, data),
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAYMENTS API
// ═══════════════════════════════════════════════════════════════════════════════

export const paymentsAPI = {
  createStripeIntent: (data) => api.post('/v1/payments/create-intent', data),
  verifyStripe: (data) => api.post('/v1/payments/verify', data),
  createKhaltiIntent: (data) => api.post('/v1/payments/khalti/create-intent', data),
  verifyKhalti: (data) => api.post('/v1/payments/khalti/verify', data),
  getHistory: () => api.get('/v1/payments/history'),
}

// ═══════════════════════════════════════════════════════════════════════════════
//  NOTIFICATIONS API
// ═══════════════════════════════════════════════════════════════════════════════

export const notificationsAPI = {
  getAll: (params) => api.get('/v1/notifications', { params }),
  markAllRead: () => api.patch('/v1/notifications/read-all'),
  markRead: (id) => api.patch(`/v1/notifications/${id}/read`),
}

// ═══════════════════════════════════════════════════════════════════════════════
//  HOST API
// ═══════════════════════════════════════════════════════════════════════════════

export const hostAPI = {
  getEarnings: () => api.get('/v1/host/earnings'),
  requestPayout: (data) => api.post('/v1/host/payouts/request', data),
  submitGeneralKYC: (formData) => api.post('/v1/host/property-verification', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  submitVerification: (listingId, formData) => api.post(`/v1/host/property-verification/${listingId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getVerificationStatus: (listingId) => api.get(listingId ? `/v1/host/property-verification/${listingId}` : '/v1/host/property-verification'),
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN API
// ═══════════════════════════════════════════════════════════════════════════════

export const adminAPI = {
  getDashboard: () => api.get('/v1/admin/dashboard'),
  getUsers: (params) => api.get('/v1/admin/users', { params }),
  getPendingKYC: () => api.get('/v1/admin/kyc/pending'),
  approveKYC: (id) => api.patch(`/v1/admin/kyc/${id}/approve`),
  rejectKYC: (id, data) => api.patch(`/v1/admin/kyc/${id}/reject`, data),
  getDisputes: (params) => api.get('/v1/admin/disputes', { params }),
  getReviews: (params) => api.get('/v1/admin/reviews', { params }),
  deleteReview: (id) => api.delete(`/v1/admin/reviews/${id}`),
  approveListing: (id) => api.post(`/v1/admin/listings/${id}/approve`),
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MEDIA API
// ═══════════════════════════════════════════════════════════════════════════════

export const mediaAPI = {
  upload: (formData) => api.post('/v1/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MESSAGING API
// ═══════════════════════════════════════════════════════════════════════════════

export const messagingAPI = {
  startConversation: (data) => api.post('/v1/conversations', data),
  getConversations: () => api.get('/v1/conversations'),
  getMessages: (conversationId) => api.get(`/v1/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, data) => api.post(`/v1/conversations/${conversationId}/messages`, data),
}

export default api
