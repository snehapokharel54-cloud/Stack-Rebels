/**
 * auth/AuthCard.jsx  — wrapper card shared by all auth views ok
 */
import { motion } from 'framer-motion'

export default function AuthCard({ children, maxWidth = 480 }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'Open Sans', sans-serif",
      background: 'linear-gradient(160deg, #f0f5ff 0%, #eaf4f0 50%, #f5efff 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient blobs */}
      <div style={{ position: 'absolute', top: -120, left: -120, width: 420, height: 420, borderRadius: '50%', background: '#093880', opacity: 0.07, filter: 'blur(90px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -120, right: -120, width: 420, height: 420, borderRadius: '50%', background: '#63b74e', opacity: 0.08, filter: 'blur(90px)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth, position: 'relative' }}
      >
        <div style={{
          background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(24px)',
          borderRadius: 28, boxShadow: '0 24px 80px rgba(0,0,0,0.12)',
          border: '1px solid rgba(255,255,255,0.6)', overflow: 'hidden',
        }}>
          {children}
        </div>
      </motion.div>
    </div>
  )
}
