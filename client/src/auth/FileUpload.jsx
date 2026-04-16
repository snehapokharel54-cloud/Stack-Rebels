/**
 * auth/FileUpload.jsx — Drag-and-drop file upload with preview + tooltip
 */
import { useState, useRef } from 'react'
import { FiUploadCloud, FiFile, FiX, FiInfo } from 'react-icons/fi'

export default function FileUpload({ label, hint, accept = 'image/*,.pdf', onFile, file, tooltip }) {
  const [dragging, setDragging] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) onFile(dropped)
  }

  const isImage = file && file.type?.startsWith('image/')
  const preview = isImage ? URL.createObjectURL(file) : null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </label>
        {tooltip && (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button type="button" onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 0 }}>
              <FiInfo size={14} />
            </button>
            {showTip && (
              <div style={{
                position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)',
                background: '#1e293b', color: '#fff', fontSize: 12, padding: '8px 12px',
                borderRadius: 10, whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                zIndex: 10, lineHeight: 1.5,
              }}>
                {tooltip}
                <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderTop: '6px solid #1e293b', borderLeft: '6px solid transparent', borderRight: '6px solid transparent' }} />
              </div>
            )}
          </div>
        )}
      </div>

      {file ? (
        <div style={{ borderRadius: 14, border: '1.5px solid #e5e7eb', overflow: 'hidden', position: 'relative' }}>
          {isImage ? (
            <img src={preview} alt="preview" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ background: '#eff6ff', padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiFile size={22} style={{ color: '#2563eb' }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: '#111827', marginBottom: 2 }}>{file.name}</p>
                <p style={{ fontSize: 11, color: '#9ca3af' }}>{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          )}
          <button type="button" onClick={() => onFile(null)}
            style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <FiX size={14} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#093880' : '#d1d5db'}`,
            borderRadius: 14, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
            background: dragging ? '#eff6ff' : '#fafafa',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: dragging ? '#dbeafe' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', transition: 'background 0.2s' }}>
            <FiUploadCloud size={24} style={{ color: dragging ? '#093880' : '#9ca3af' }} />
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
            {dragging ? 'Drop file here' : 'Drag & drop or click to upload'}
          </p>
          <p style={{ fontSize: 12, color: '#9ca3af' }}>{hint || 'JPG, PNG, or PDF · Max 5MB'}</p>
          <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }}
            onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]) }} />
        </div>
      )}
    </div>
  )
}
