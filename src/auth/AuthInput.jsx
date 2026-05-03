/**
 * auth/AuthInput.jsx — reusable input with left icon and optional right button
 */
import { useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'

const BASE = {
  width: '100%', padding: '13px 16px 13px 42px',
  borderRadius: 12, border: '1.5px solid #e5e7eb',
  fontSize: 14, color: '#111827', background: '#fafafa', outline: 'none',
  fontFamily: "'Open Sans', sans-serif", boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

export function AuthInput({ icon: Icon, type = 'text', placeholder, value, onChange, error, id, rightNode, ...rest }) {
  const [focused, setFocused] = useState(false)

  return (
    <div>
      <div style={{ position: 'relative' }}>
        {Icon && (
          <Icon
            size={16}
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focused ? '#093880' : '#9ca3af', pointerEvents: 'none', transition: 'color 0.2s' }}
          />
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...BASE,
            paddingRight: rightNode ? 44 : 16,
            borderColor: error ? '#fca5a5' : focused ? '#093880' : '#e5e7eb',
            boxShadow: focused ? '0 0 0 3px rgba(9,56,128,0.08)' : 'none',
            background: error ? '#fff8f8' : '#fafafa',
          }}
          {...rest}
        />
        {rightNode && (
          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
            {rightNode}
          </div>
        )}
      </div>
      {error && (
        <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4, marginLeft: 2 }}>{error}</p>
      )}
    </div>
  )
}

export function PasswordInput({ value, onChange, placeholder = 'Password', error, id }) {
  const [show, setShow] = useState(false)
  return (
    <AuthInput
      id={id}
      icon={({ size, style }) => (
        <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={style}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )}
      type={show ? 'text' : 'password'}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      error={error}
      rightNode={
        <button type="button" onClick={() => setShow(s => !s)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
          {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
        </button>
      }
    />
  )
}
