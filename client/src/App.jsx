import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import UserHome from './pages/UserHome'
import VendorHome from './pages/VendorHome'
import PropertyDetail from './pages/PropertyDetail'
import BookingsPage from './pages/BookingsPage'
import WishlistPage from './pages/WishlistPage'
import NotificationsPage from './pages/NotificationsPage'
import PaymentSuccess from './pages/PaymentSuccess'

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  return <Navigate to={user.role === 'vendor' ? '/vendor' : '/home'} replace />
}

export default function App() {
  const { initializing } = useAuth()

  // Show nothing while checking if token is valid on first load
  if (initializing) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#093880', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />

      {/* Payment callback (public — user returns from Khalti or Stripe) */}
      <Route path="/payment-success" element={<PaymentSuccess />} />

      {/* Role redirect after login */}
      <Route path="/dashboard" element={<RoleRedirect />} />

      {/* Public — Anyone can browse */}
      <Route path="/home" element={<UserHome />} />
      <Route path="/property/:id" element={<PropertyDetail />} />
      <Route path="/bookings" element={<ProtectedRoute requiredRole="user"><BookingsPage /></ProtectedRoute>} />
      <Route path="/wishlist" element={<ProtectedRoute requiredRole="user"><WishlistPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute requiredRole="user"><NotificationsPage /></ProtectedRoute>} />

      {/* Protected — Vendor (Host) */}
      <Route path="/vendor" element={<ProtectedRoute requiredRole="vendor"><VendorHome /></ProtectedRoute>} />
      <Route path="/vendor/*" element={<ProtectedRoute requiredRole="vendor"><VendorHome /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
