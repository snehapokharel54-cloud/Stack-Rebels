/**
 * auth/OtpInput.jsx — 6-box OTP input UI (auto-focus, paste support)
 * Fixed: useRef cannot be called in .map() — use a ref array instead
 */
import { useRef } from 'react'

const LEN = 6

export default function OtpInput({ value, onChange }) {
  const refs = useRef([])

  const focusAt = (i) => refs.current[i]?.focus()

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      if (!value[i] && i > 0) {
        const next = value.split('')
        next[i - 1] = ''
        onChange(next.join(''))
        focusAt(i - 1)
      } else {
        const next = value.split('')
        next[i] = ''
        onChange(next.join(''))
      }
      return
    }
    if (e.key === 'ArrowLeft' && i > 0) { focusAt(i - 1); return }
    if (e.key === 'ArrowRight' && i < LEN - 1) { focusAt(i + 1); return }
  }

  const handleChange = (i, e) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1)
    const chars = value.padEnd(LEN, ' ').split('')
    chars[i] = digit
    const joined = chars.join('').trimEnd()
    onChange(joined)
    if (digit && i < LEN - 1) focusAt(i + 1)
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LEN)
    onChange(pasted)
    focusAt(Math.min(pasted.length, LEN - 1))
  }

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {Array.from({ length: LEN }).map((_, i) => (
        <input
          key={i}
          ref={el => refs.current[i] = el}
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          style={{
            width: 48, height: 56, textAlign: 'center',
            fontSize: 22, fontWeight: 700, fontFamily: "'Poppins', sans-serif",
            borderRadius: 14, border: `2px solid ${value[i] ? '#093880' : '#e5e7eb'}`,
            background: value[i] ? '#eff6ff' : '#fafafa',
            color: '#0f172a', outline: 'none',
            transition: 'all 0.18s',
            boxShadow: value[i] ? '0 0 0 3px rgba(9,56,128,0.1)' : 'none',
          }}
          onFocus={e => { e.target.style.borderColor = '#093880'; e.target.style.boxShadow = '0 0 0 3px rgba(9,56,128,0.12)' }}
          onBlur={e => {
            e.target.style.borderColor = value[i] ? '#093880' : '#e5e7eb'
            e.target.style.boxShadow = value[i] ? '0 0 0 3px rgba(9,56,128,0.1)' : 'none'
          }}
        />
      ))}
    </div>
  )
}
