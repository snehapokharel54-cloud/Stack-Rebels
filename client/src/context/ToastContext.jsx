import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCheck, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi'

const ToastContext = createContext(null)

const ICONS = {
  success: FiCheck,
  error: FiX,
  warning: FiAlertCircle,
  info: FiInfo,
}

const COLORS = {
  success: { bg: '#ecfdf5', border: '#86efac', icon: '#16a34a', text: '#15803d' },
  error:   { bg: '#fef2f2', border: '#fecaca', icon: '#dc2626', text: '#b91c1c' },
  warning: { bg: '#fffbeb', border: '#fde68a', icon: '#d97706', text: '#b45309' },
  info:    { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', text: '#1d4ed8' },
}

function ToastItem({ id, message, type, onClose }) {
  const clr = COLORS[type] || COLORS.info
  const Icon = ICONS[type] || FiInfo

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.92 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        background: clr.bg, border: `1.5px solid ${clr.border}`,
        borderRadius: 14, padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        minWidth: 280, maxWidth: 380, width: '100%',
        pointerEvents: 'all',
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: clr.icon + '20',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={14} style={{ color: clr.icon }} />
      </div>
      <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: clr.text, lineHeight: 1.5 }}>
        {message}
      </p>
      <button
        onClick={() => onClose(id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: clr.icon, display: 'flex', alignItems: 'center',
          padding: 2, opacity: 0.7, flexShrink: 0,
        }}
      >
        <FiX size={14} />
      </button>
    </motion.div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), duration)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10,
        alignItems: 'flex-end', pointerEvents: 'none',
      }}>
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <ToastItem key={t.id} {...t} onClose={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
