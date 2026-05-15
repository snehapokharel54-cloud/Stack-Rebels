import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiCheckCircle, FiXCircle, FiLoader, FiHome } from 'react-icons/fi'
import { paymentsAPI } from '../services/api'
import Navbar from '../components/Navbar'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const pidx = searchParams.get('pidx')
  const sessionId = searchParams.get('session_id')
  const gateway = searchParams.get('gateway')
  const bookingId = searchParams.get('booking_id') || searchParams.get('purchase_order_id')
  
  const [status, setStatus] = useState('verifying') // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Verifying your payment with Khalti...')
  
  const hasVerified = useRef(false)

  useEffect(() => {
    const verifyPayment = async () => {
      if (hasVerified.current) return
      hasVerified.current = true
      
      try {
        let res;
        if (gateway === 'stripe' || sessionId) {
          if (!sessionId || !bookingId) {
            setStatus('error')
            setMessage('Invalid payment return URL. Missing parameters.')
            return
          }
          setMessage('Verifying your payment with Stripe...')
          res = await paymentsAPI.verifyStripe({ session_id: sessionId, booking_id: bookingId })
        } else {
          if (!pidx || !bookingId) {
            setStatus('error')
            setMessage('Invalid payment return URL. Missing parameters.')
            return
          }
          setMessage('Verifying your payment with Khalti...')
          res = await paymentsAPI.verifyKhalti({ pidx, booking_id: bookingId })
        }

        if (res.data?.success || res.data?.status === 'CONFIRMED') {
          setStatus('success')
          setMessage('Payment successful! Your booking is now confirmed.')
        } else {
          setStatus('error')
          setMessage('Payment verification failed. Please contact support.')
        }
      } catch (err) {
        console.error('Payment verification error:', err)
        setStatus('error')
        setMessage(err.response?.data?.message || 'An error occurred while verifying your payment.')
      }
    }

    verifyPayment()
  }, [pidx, sessionId, gateway, bookingId])

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Open Sans', sans-serif" }}>
      <Navbar />
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            background: '#fff', 
            borderRadius: 24, 
            padding: 48, 
            maxWidth: 480, 
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.05)'
          }}
        >
          {status === 'verifying' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <FiLoader className="spin" size={64} style={{ color: '#3b82f6', marginBottom: 24 }} />
              <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .spin { animation: spin 1.5s linear infinite; }
              `}</style>
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 12 }}>
                Verifying Payment
              </h2>
              <p style={{ color: '#6b7280', lineHeight: 1.6 }}>{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <FiCheckCircle size={72} style={{ color: '#10b981', marginBottom: 24 }} />
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 12 }}>
                Booking Confirmed!
              </h2>
              <p style={{ color: '#4b5563', lineHeight: 1.6, marginBottom: 24 }}>
                {message} You can view all the details and manage your stay in your bookings page.
              </p>

              <div style={{ background: '#f9fafb', borderRadius: 16, padding: 20, width: '100%', marginBottom: 32, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: '#6b7280', fontSize: 14 }}>Booking ID</span>
                  <span style={{ color: '#111827', fontWeight: 600, fontSize: 14 }}>#{bookingId?.slice(0, 8)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: '#6b7280', fontSize: 14 }}>Payment Method</span>
                  <span style={{ color: '#111827', fontWeight: 600, fontSize: 14 }}>{gateway === 'stripe' || sessionId ? 'Stripe (Card)' : 'Khalti ePayment'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: 14 }}>Status</span>
                  <span style={{ color: '#10b981', fontWeight: 700, fontSize: 14 }}>CONFIRMED</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 16, width: '100%' }}>
                <button 
                  onClick={() => navigate('/bookings')}
                  style={{ flex: 1, padding: '14px', borderRadius: 12, background: '#093880', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 15 }}
                >
                  View My Bookings
                </button>
                <button 
                  onClick={() => navigate('/')}
                  style={{ padding: '14px 20px', borderRadius: 12, background: '#f3f4f6', color: '#374151', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <FiHome size={20} />
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <FiXCircle size={72} style={{ color: '#ef4444', marginBottom: 24 }} />
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
                Payment Verification Failed
              </h2>
              <p style={{ color: '#6b7280', lineHeight: 1.6, marginBottom: 32 }}>
                {message}
              </p>
              <button 
                onClick={() => navigate('/bookings')}
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}
              >
                Go to Bookings
              </button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
