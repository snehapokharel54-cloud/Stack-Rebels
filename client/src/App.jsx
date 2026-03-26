import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import UserHome from './pages/UserHome'
import VendorHome from './pages/VendorHome'

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
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
      <Route
        path="/home"
        element={
          <ProtectedRoute requiredRole="user">
            <UserHome />
          </ProtectedRoute>
        }
      />

      {/* Protected — Vendor (Host) */}
      <Route
        path="/vendor"
        element={
          <ProtectedRoute requiredRole="vendor">
            <VendorHome />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
