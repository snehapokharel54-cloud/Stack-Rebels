/**
 * pages/PaymentSuccess.jsx — Handles payment verification for both Stripe and Khalti
 */
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiCheck, FiX } from 'react-icons/fi'
import { useAppData } from '../context/AppDataContext'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyKhaltiPayment, verifyStripePayment } = useAppData()
  const [status, setStatus] = useState('verifying') // verifying | success | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const gateway = searchParams.get('gateway') || 'khalti'
    const bookingId = searchParams.get('booking_id') || searchParams.get('purchase_order_id') || localStorage.getItem('khalti_booking_id')
    
    // Gateway specific params
    const pidx = searchParams.get('pidx')
    const sessionId = searchParams.get('session_id')

    if (!bookingId) {
      setStatus('error')
      setErrorMsg('Missing booking reference. Please contact support.')
      return
    }

    const verify = async () => {
      let res
      if (gateway === 'stripe') {
        if (!sessionId) {
          setStatus('error')
          setErrorMsg('Missing Stripe session ID.')
          return
        }
        res = await verifyStripePayment(bookingId, null, sessionId)
      } else {
        // Default to Khalti
        if (!pidx) {
          setStatus('error')
          setErrorMsg('Missing Khalti payment reference.')
          return
        }
        res = await verifyKhaltiPayment(bookingId, pidx)
        localStorage.removeItem('khalti_booking_id')
      }

      if (res.ok) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMsg(res.error || 'Payment verification failed.')
      }
    }

    verify()
  }, [searchParams, verifyKhaltiPayment, verifyStripePayment])

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Open Sans', sans-serif" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: '#fff', borderRadius: 24, boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          border: '1.5px solid #f0f0f0', padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center',
        }}
      >
        {status === 'verifying' && (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#093880', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
              Verifying Payment
            </h2>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Please wait while we confirm your payment status...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <FiCheck size={28} style={{ color: '#16a34a' }} />
            </div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 22, color: '#16a34a', marginBottom: 8 }}>
              Booking Confirmed! 🎉
            </h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
              Your payment has been verified. You'll receive a confirmation email with all details shortly.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/bookings')}
              style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #093880, #1a56c4)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}
            >
              View My Bookings
            </motion.button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <FiX size={28} style={{ color: '#dc2626' }} />
            </div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 22, color: '#dc2626', marginBottom: 8 }}>
              Verification Failed
            </h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>{errorMsg}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => navigate('/home')}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                Go Home
              </button>
              <button onClick={() => navigate('/bookings')}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#093880', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                My Bookings
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
