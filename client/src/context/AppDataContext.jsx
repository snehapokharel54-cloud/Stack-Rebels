import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { allListings } from '../data/listings'

const AppDataContext = createContext(null)

const STORAGE_KEYS = {
  wishlist: 'grihastha_wishlist',
  bookings: 'grihastha_bookings',
  notifications: 'grihastha_notifications',
  hostProperties: 'grihastha_host_properties',
  propertyViews: 'grihastha_property_views',
}

function loadFromStorage(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

export function AppDataProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => loadFromStorage(STORAGE_KEYS.wishlist, []))
  const [bookings, setBookings] = useState(() => loadFromStorage(STORAGE_KEYS.bookings, []))
  const [notifications, setNotifications] = useState(() => loadFromStorage(STORAGE_KEYS.notifications, []))
  const [hostProperties, setHostProperties] = useState(() => loadFromStorage(STORAGE_KEYS.hostProperties, []))
  const [propertyViews, setPropertyViews] = useState(() => loadFromStorage(STORAGE_KEYS.propertyViews, {}))
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [priceRange, setPriceRange] = useState([0, 15000])

  // Persist to localStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.wishlist, JSON.stringify(wishlist)) }, [wishlist])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings)) }, [bookings])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications)) }, [notifications])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.hostProperties, JSON.stringify(hostProperties)) }, [hostProperties])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.propertyViews, JSON.stringify(propertyViews)) }, [propertyViews])

  // All available properties = static + host-uploaded
  const allProperties = [...allListings, ...hostProperties.filter(p => p.available !== false)]

  // Filtered properties for user home
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

    // Check double booking
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

  // Cancel booking
  const cancelBooking = useCallback((bookingId) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
  }, [])

  // Get bookings for user
  const getUserBookings = useCallback((userId) => {
    return bookings.filter(b => b.userId === userId)
  }, [bookings])

  // Get bookings for host
  const getHostBookings = useCallback((hostId) => {
    return bookings.filter(b => b.hostId === hostId)
  }, [bookings])

  // Host CRUD
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
      createdAt: new Date().toISOString(),
    }
    setHostProperties(prev => [newProp, ...prev])
    addNotification({
      type: 'listing',
      title: 'Property Listed! 🏠',
      message: `"${property.title}" is now live and visible to guests.`,
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

  // Host analytics
  const getHostAnalytics = useCallback((hostId) => {
    const props = getHostProperties(hostId)
    const hBookings = getHostBookings(hostId)
    const confirmedBookings = hBookings.filter(b => b.status === 'confirmed')
    const totalEarnings = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    const totalListings = props.length
    const totalBookings = confirmedBookings.length

    // Monthly revenue (last 6 months)
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

    // Occupancy rate (rough estimate)
    const totalAvailableDays = props.length * 30
    const totalBookedDays = confirmedBookings.reduce((sum, b) => {
      const days = Math.max(1, Math.round((new Date(b.checkOut) - new Date(b.checkIn)) / (1000 * 60 * 60 * 24)))
      return sum + days
    }, 0)
    const occupancyRate = totalAvailableDays > 0 ? Math.min(100, Math.round((totalBookedDays / totalAvailableDays) * 100)) : 0

    // Top property
    const propBookingCount = {}
    confirmedBookings.forEach(b => {
      propBookingCount[b.propertyId] = (propBookingCount[b.propertyId] || 0) + 1
    })
    const topPropertyId = Object.entries(propBookingCount).sort((a, b) => b[1] - a[1])[0]?.[0]
    const topProperty = topPropertyId ? allProperties.find(p => String(p.id) === String(topPropertyId)) : null

    return { totalListings, totalBookings, totalEarnings, occupancyRate, monthlyData: months, topProperty, confirmedBookings }
  }, [getHostProperties, getHostBookings, allProperties])

  return (
    <AppDataContext.Provider value={{
      // Properties
      allProperties,
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
