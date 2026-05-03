import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import UserHome from './pages/UserHome'
import VendorHome from './pages/VendorHome'
import PropertyDetail from './pages/PropertyDetail'
import WishlistPage from './pages/WishlistPage'
import BookingHistoryPage from './pages/BookingHistoryPage'
import NotificationsPage from './pages/NotificationsPage'
import AdminDashboard from './pages/AdminDashboard'
import ReviewsPage from './pages/ReviewsPage'

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to={user.role === 'vendor' ? '/vendor' : '/home'} replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />

      {/* Role redirect after login */}
      <Route path="/dashboard" element={<RoleRedirect />} />

      {/* Protected — User (Guest) */}
      <Route path="/home" element={<ProtectedRoute requiredRole="user"><UserHome /></ProtectedRoute>} />
      <Route path="/property/:id" element={<ProtectedRoute requiredRole="user"><PropertyDetail /></ProtectedRoute>} />
      <Route path="/property/:id/reviews" element={<ProtectedRoute requiredRole="user"><ReviewsPage /></ProtectedRoute>} />
      <Route path="/wishlist" element={<ProtectedRoute requiredRole="user"><WishlistPage /></ProtectedRoute>} />
      <Route path="/bookings" element={<ProtectedRoute requiredRole="user"><BookingHistoryPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute requiredRole="user"><NotificationsPage /></ProtectedRoute>} />

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
