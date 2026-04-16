import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiHeart, FiStar, FiMapPin, FiUsers, FiHome, FiCheck, FiChevronLeft, FiChevronRight, FiShare2, FiSun, FiWind } from 'react-icons/fi'
import { FaHeart, FaStar, FaWifi, FaParking, FaSwimmingPool, FaDumbbell, FaLeaf } from 'react-icons/fa'
import { MdAir, MdKitchen, MdLocalLaundryService, MdTv } from 'react-icons/md'
import Navbar from '../components/Navbar'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const AMENITY_ICONS = {
  'WiFi': FaWifi,
  'Air Conditioning': MdAir,
  'Parking': FaParking,
  'Kitchen': MdKitchen,
  'Washing Machine': MdLocalLaundryService,
  'TV': MdTv,
  'Pool': FaSwimmingPool,
  'Gym': FaDumbbell,
  'Garden': FaLeaf,
  'Balcony': FiSun,
  'Hot Water': FiWind,
  'Power Backup': FiCheck,
}

const MOCK_REVIEWS = [
  { id: 1, user: 'Priya S.', avatar: 'P', rating: 5, comment: 'Absolutely beautiful place! The views were breathtaking and the host was incredibly helpful. Will definitely return.', date: 'March 2025' },
  { id: 2, user: 'Rajan M.', avatar: 'R', rating: 4, comment: 'Great value for money. Clean, comfortable and well-located. Minor issue with hot water but host resolved it quickly.', date: 'February 2025' },
  { id: 3, user: 'Anita T.', avatar: 'A', rating: 5, comment: 'One of the best stays in Nepal. The property photos don\'t do it justice — it\'s even better in person!', date: 'January 2025' },
]

export default function PropertyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { allProperties, isWishlisted, toggleWishlist, trackView, createBooking } = useAppData()
  const { user } = useAuth()
  const { showToast } = useToast()

  const property = allProperties.find(p => String(p.id) === String(id))
  const [activeImg, setActiveImg] = useState(0)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('khalti')

  const wishlisted = isWishlisted(property?.id)

  useEffect(() => {
    if (property) {
      trackView(property.id)
      window.scrollTo(0, 0)
    }
  }, [property, trackView])

  if (!property) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <FiHome size={32} style={{ color: '#9ca3af' }} />
          </div>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 800, marginTop: 0, color: '#111827' }}>Property Not Found</h2>
          <p style={{ color: '#6b7280', marginTop: 8 }}>This listing may have been removed or doesn't exist.</p>
          <button onClick={() => navigate('/home')} style={{ marginTop: 24, padding: '12px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            Browse Properties
          </button>
        </div>
      </div>
    )
  }

  const images = property.images?.length > 0 ? property.images : [property.image]

  const getNights = () => {
    if (!checkIn || !checkOut) return 0
    const diff = new Date(checkOut) - new Date(checkIn)
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }
  const nights = getNights()
  const totalPrice = nights * property.price

  const handleBookNow = () => {
    setBookingError('')
    if (!user) { navigate('/auth'); return }
    if (!checkIn || !checkOut) { setBookingError('Please select check-in and check-out dates.'); return }
    if (nights < 1) { setBookingError('Check-out must be after check-in.'); return }
    if (guests < 1 || guests > property.maxGuests) { setBookingError(`Guests must be between 1 and ${property.maxGuests}.`); return }
    setShowPaymentModal(true)
  }

  const handlePaymentConfirm = async () => {
    setIsBooking(true)
    await new Promise(r => setTimeout(r, 1500)) // Simulate payment
    const result = createBooking({
      propertyId: property.id,
      userId: user.email,
      userEmail: user.email,
      userName: user.name,
      checkIn, checkOut, guests, totalPrice,
    })
    setIsBooking(false)
    setShowPaymentModal(false)
    if (!result.ok) {
      setBookingError(result.error)
    } else {
      setBookingSuccess(true)
      showToast('Booking confirmed! Check your bookings for details.', 'success')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Open Sans', sans-serif" }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Back + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#374151', fontSize: 14, fontWeight: 600, padding: 0 }}>
            <FiArrowLeft size={18} /> Back
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigator.clipboard?.writeText(window.location.href)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
              <FiShare2 size={14} /> Share
            </button>
            <button onClick={() => toggleWishlist(property.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: wishlisted ? '#fef2f2' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: wishlisted ? '#ef4444' : '#374151' }}>
              {wishlisted ? <FaHeart style={{ color: '#ef4444' }} size={14} /> : <FiHeart size={14} />}
              {wishlisted ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>
          {property.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <FaStar style={{ color: '#f59e0b' }} size={14} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>{property.rating}</span>
            <span style={{ color: '#6b7280', fontSize: 13 }}>({property.reviews} reviews)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontSize: 13 }}>
            <FiMapPin size={13} /> {property.location}
          </div>
          <span style={{ background: '#eef2ff', color: '#4f46e5', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, textTransform: 'capitalize' }}>
            {property.category}
          </span>
        </div>

        {/* Image Gallery */}
        <div style={{ display: 'grid', gridTemplateColumns: images.length > 1 ? '1fr 1fr' : '1fr', gap: 8, marginBottom: 40, borderRadius: 20, overflow: 'hidden', maxHeight: 440 }}>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: images.length > 1 ? '20px 0 0 20px' : 20, gridRow: '1 / 3' }}>
            <img src={images[activeImg]} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 300 }} />
            {images.length > 1 && (
              <>
                <button onClick={() => setActiveImg(p => (p - 1 + images.length) % images.length)}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
                  <FiChevronLeft size={18} />
                </button>
                <button onClick={() => setActiveImg(p => (p + 1) % images.length)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
                  <FiChevronRight size={18} />
                </button>
                <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      style={{ width: i === activeImg ? 20 : 8, height: 8, borderRadius: 999, border: 'none', background: i === activeImg ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.2s' }} />
                  ))}
                </div>
              </>
            )}
          </div>
          {images.length > 1 && images.slice(1, 3).map((img, i) => (
            <div key={i} style={{ overflow: 'hidden', borderRadius: i === 0 ? '0 20px 0 0' : '0 0 20px 0', cursor: 'pointer' }} onClick={() => setActiveImg(i + 1)}>
              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 140 }} />
            </div>
          ))}
        </div>

        {/* Content + Booking sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40, alignItems: 'start' }}>
          {/* Left: Details */}
          <div>
            {/* Host */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 24, borderBottom: '1px solid #f0f0f0', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 20, color: '#0f172a', marginBottom: 4 }}>
                  Hosted by {property.hostName}
                </h2>
                <div style={{ display: 'flex', gap: 16, color: '#6b7280', fontSize: 13 }}>
                  <span><FiHome size={12} /> {property.bedrooms} bedroom{property.bedrooms > 1 ? 's' : ''}</span>
                  <span><FiUsers size={12} /> {property.maxGuests} guests max</span>
                </div>
              </div>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #093880, #1a56c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20, fontFamily: "'Poppins', sans-serif" }}>
                {property.hostAvatar}
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 18, color: '#0f172a', marginBottom: 12 }}>About this place</h3>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.75 }}>{property.description}</p>
            </div>

            {/* Amenities */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 18, color: '#0f172a', marginBottom: 16 }}>What this place offers</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {property.amenities?.map(amenity => {
                  const Icon = AMENITY_ICONS[amenity]
                  return (
                    <div key={amenity} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff' }}>
                      {Icon ? <Icon size={18} style={{ color: '#093880' }} /> : <FiCheck size={16} style={{ color: '#093880' }} />}
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{amenity}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Map placeholder */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 18, color: '#0f172a', marginBottom: 16 }}>Location</h3>
              <div style={{ borderRadius: 16, overflow: 'hidden', border: '1.5px solid #e5e7eb', height: 240, background: '#f3f4f6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiMapPin size={24} style={{ color: '#093880' }} />
                </div>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#374151' }}>{property.location}</p>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.location + ', Nepal')}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: '#093880', textDecoration: 'underline', cursor: 'pointer' }}>
                  View on Google Maps →
                </a>
              </div>
            </div>

            {/* Reviews */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 18, color: '#0f172a', margin: 0 }}>Reviews</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FaStar style={{ color: '#f59e0b' }} size={14} />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{property.rating}</span>
                  <span style={{ color: '#6b7280', fontSize: 13 }}>· {property.reviews} reviews</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {MOCK_REVIEWS.map(review => (
                  <motion.div key={review.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    style={{ padding: '20px 24px', borderRadius: 16, border: '1.5px solid #f0f0f0', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #093880, #1a56c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15 }}>
                        {review.avatar}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{review.user}</p>
                        <p style={{ fontSize: 12, color: '#9ca3af' }}>{review.date}</p>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                        {[...Array(review.rating)].map((_, i) => <FaStar key={i} style={{ color: '#f59e0b' }} size={12} />)}
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65 }}>{review.comment}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Booking widget */}
          <div style={{ position: 'sticky', top: 120 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: '#fff', borderRadius: 24, boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1.5px solid #f0f0f0', padding: '28px 24px' }}
            >
              {bookingSuccess ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <FiCheck size={28} style={{ color: '#16a34a' }} />
                  </div>
                  <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 20, color: '#16a34a', marginBottom: 8 }}>Booking Confirmed!</h3>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Your stay at "{property.title}" has been booked successfully.</p>
                  <button onClick={() => navigate('/bookings')}
                    style={{ width: '100%', padding: '13px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: "'Poppins', sans-serif" }}>
                    View My Bookings
                  </button>
                </motion.div>
              ) : (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 22, color: '#111827' }}>NPR {property.price.toLocaleString()}</span>
                    <span style={{ fontSize: 14, color: '#6b7280' }}> / night</span>
                  </div>

                  <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ padding: '12px 14px', borderRight: '1px solid #e5e7eb' }}>
                        <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', marginBottom: 4 }}>Check-in</p>
                        <input id="book-checkin" type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          style={{ border: 'none', outline: 'none', fontSize: 13, fontWeight: 600, color: '#111827', width: '100%', background: 'transparent' }} />
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', marginBottom: 4 }}>Check-out</p>
                        <input id="book-checkout" type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
                          min={checkIn || new Date().toISOString().split('T')[0]}
                          style={{ border: 'none', outline: 'none', fontSize: 13, fontWeight: 600, color: '#111827', width: '100%', background: 'transparent' }} />
                      </div>
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', marginBottom: 4 }}>Guests</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => setGuests(g => Math.max(1, g - 1))}
                          style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>−</button>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{guests} guest{guests > 1 ? 's' : ''}</span>
                        <button onClick={() => setGuests(g => Math.min(property.maxGuests, g + 1))}
                          style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>+</button>
                      </div>
                    </div>
                  </div>

                  {bookingError && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 12, marginBottom: 12 }}>
                      {bookingError}
                    </div>
                  )}

                  <motion.button
                    id="book-now-btn"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleBookNow}
                    style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(9,56,128,0.3)', fontFamily: "'Poppins', sans-serif", marginBottom: 12 }}
                  >
                    Book Now
                  </motion.button>

                  {nights > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginTop: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                        <span>NPR {property.price.toLocaleString()} × {nights} night{nights > 1 ? 's' : ''}</span>
                        <span>NPR {(property.price * nights).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                        <span>Service fee</span>
                        <span>NPR {Math.round(totalPrice * 0.1).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, color: '#111827', borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                        <span>Total</span>
                        <span>NPR {Math.round(totalPrice * 1.1).toLocaleString()}</span>
                      </div>
                    </motion.div>
                  )}

                  <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 12 }}>You won't be charged yet</p>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      {/* Payment modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 24, padding: '32px', maxWidth: 440, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}
            >
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 20, color: '#0f172a', marginBottom: 6 }}>Complete Payment</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
                {property.title} · {nights} night{nights > 1 ? 's' : ''} · NPR {Math.round(totalPrice * 1.1).toLocaleString()}
              </p>

              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Payment Method</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['khalti', 'esewa', 'card'].map(m => (
                    <button key={m} onClick={() => setPaymentMethod(m)}
                      style={{ flex: 1, padding: '12px 8px', borderRadius: 12, border: `2px solid ${paymentMethod === m ? '#093880' : '#e5e7eb'}`, background: paymentMethod === m ? '#f0f5ff' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: paymentMethod === m ? '#093880' : '#6b7280', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                      {m === 'khalti' ? 'Khalti' : m === 'esewa' ? 'eSewa' : 'Card'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: '#f9fafb', borderRadius: 14, padding: '16px', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: '#6b7280' }}>
                  <span>Subtotal</span><span>NPR {totalPrice.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: '#6b7280' }}>
                  <span>Service fee (10%)</span><span>NPR {Math.round(totalPrice * 0.1).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#111827', borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
                  <span>Total</span><span>NPR {Math.round(totalPrice * 1.1).toLocaleString()}</span>
                </div>
              </div>

              <motion.button
                id="confirm-payment-btn"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handlePaymentConfirm} disabled={isBooking}
                style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: isBooking ? 0.8 : 1, fontFamily: "'Poppins', sans-serif" }}
              >
                {isBooking ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Processing...</> : `Pay NPR ${Math.round(totalPrice * 1.1).toLocaleString()}`}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
