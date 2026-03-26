import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) return <Navigate to="/auth" replace />
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.role === 'vendor' ? '/vendor' : '/home'} replace />
  }

  return children
}
