import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getToken } from '../services/api'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, initializing } = useAuth()
  const token = getToken()

  // Still loading — don't redirect yet
  if (initializing) return null

  // No token or user — go to login
  if (!token || !user) return <Navigate to="/auth" replace />

  // Role check
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'vendor' ? '/vendor' : '/home'} replace />
  }

  return children
}
