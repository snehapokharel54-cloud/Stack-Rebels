import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// The only email that is allowed to hold the admin role.
// This is a second layer of defence — even if AuthContext is somehow bypassed,
// a user claiming admin role with the wrong email gets kicked out.
const ADMIN_EMAIL = 'admin@grihastha.com'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth()

  // Not logged in → go to auth with requested role
  if (!user) return <Navigate to={`/auth?mode=login&role=${requiredRole || 'user'}`} replace />

  // ── Prevent fraudulent admin access ─────────────────────────────────────────
  // If the session says role === 'admin' but the email isn't the real admin,
  // treat them as unauthenticated and send them to /auth.
  if (user.role === 'admin' && user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return <Navigate to="/auth" replace />
  }

  // ── Role mismatch: redirect to the correct home ──────────────────────────────
  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'vendor') return <Navigate to="/vendor" replace />
    return <Navigate to="/home" replace />
  }

  return children
}
