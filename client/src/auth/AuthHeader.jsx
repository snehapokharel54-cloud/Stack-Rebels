/**
 * auth/AuthHeader.jsx — blue gradient header block shown in all auth cards
 */
export default function AuthHeader({ title, subtitle, step, totalSteps }) {
  return (
    <div style={{ padding: '32px 36px 28px', background: 'linear-gradient(135deg, #093880, #1a56c4)' }}>
      {/* Logo row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: totalSteps ? 20 : 24 }}>
        <img src="/grihastha-logo.svg" alt="Grihastha"
          style={{ width: 34, height: 34, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 17, fontFamily: "'Poppins', sans-serif" }}>
          Grihastha
        </span>
        {totalSteps && (
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
            Step {step + 1} of {totalSteps}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {totalSteps && (
        <div style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.2)', marginBottom: 20, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999, background: '#fff',
            width: `${((step + 1) / totalSteps) * 100}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
      )}

      <h1 style={{ fontFamily: "'Poppins', sans-serif", color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
        {title}
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 1.55 }}>
        {subtitle}
      </p>
    </div>
  )
}
