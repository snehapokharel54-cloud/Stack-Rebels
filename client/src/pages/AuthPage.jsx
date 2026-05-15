/**
 * pages/AuthPage.jsx — Orchestrator
 *
 * view states:
 *   'login'   → LoginView
 *   'signup'  → SignupFlow (user or vendor)
 *   'forgot'  → ForgotPassword
 *   'reset'   → ResetPassword
 */
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import LoginView from '../auth/LoginView'
import SignupFlow from '../auth/SignupFlow'
import ForgotPassword from '../auth/ForgotPassword'
import ResetPassword from '../auth/ResetPassword'

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  // Derive initial view from URL
  const getView = () => {
    if (searchParams.get('mode') === 'signup') return 'signup'
    if (searchParams.get('mode') === 'forgot') return 'forgot'
    if (searchParams.get('mode') === 'reset') return 'reset'
    return 'login'
  }
  const [view, setView] = useState(getView)

  // role from URL: ?role=vendor → vendor signup
  const role = searchParams.get('role') === 'vendor' ? 'vendor' : 'user'

  // If already logged in, redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') navigate('/admin', { replace: true })
      else if (user.role === 'vendor') navigate('/vendor', { replace: true })
      else navigate('/home', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  // Keep URL in sync
  const switchView = (v, extra = {}) => {
    setView(v)
    const next = new URLSearchParams()
    next.set('mode', v)
    if (extra.role) next.set('role', extra.role)
    setSearchParams(next, { replace: true })
  }

  return (
    <AnimatePresence mode="wait">
      {view === 'login' && (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <LoginView
            onSwitchToSignup={() => switchView('signup', { role })}
            onForgotPassword={() => switchView('forgot')}
          />
        </motion.div>
      )}
      {view === 'signup' && (
        <motion.div key="signup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <SignupFlow
            role={role}
            onSwitchToLogin={() => switchView('login')}
            onRoleChange={(newRole) => switchView('signup', { role: newRole })}
          />
        </motion.div>
      )}
      {view === 'forgot' && (
        <motion.div key="forgot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <ForgotPassword
            onBack={() => switchView('login')}
          />
        </motion.div>
      )}
      {view === 'reset' && (
        <motion.div key="reset" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <ResetPassword
            onBack={() => switchView('login')}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
