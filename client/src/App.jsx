import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import UserHome from './pages/UserHome'
import VendorHome from './pages/VendorHome'
import PropertyDetail from './pages/PropertyDetail'
import WishlistPage from './pages/WishlistPage'
import BookingHistoryPage from './pages/BookingHistoryPage'
import NotificationsPage from './pages/NotificationsPage'
import AdminDashboard from './pages/AdminDashboard'
import ReviewsPage from './pages/ReviewsPage'
import HostProfilePage from './pages/HostProfilePage'
import ProfilePage from './pages/ProfilePage'
import MessagesPage from './pages/MessagesPage'

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to={user.role === 'vendor' ? '/vendor' : '/'} replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public — Browse listings and view property details */}
      <Route path="/" element={<UserHome />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<RoleRedirect />} />
      <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
      <Route path="/property/:id" element={<PropertyDetail />} />
      <Route path="/property/:id/reviews" element={<ReviewsPage />} />
      <Route path="/host/:hostId" element={<HostProfilePage />} />
      <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
      <Route path="/bookings" element={<ProtectedRoute><BookingHistoryPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />

      {/* Protected — Vendor (Host) */}
      <Route path="/vendor" element={<ProtectedRoute requiredRole="vendor"><VendorHome /></ProtectedRoute>} />
      <Route path="/vendor/*" element={<ProtectedRoute requiredRole="vendor"><VendorHome /></ProtectedRoute>} />

      {/* Protected — Admin */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
