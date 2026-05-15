import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiSend, FiUser, FiServer } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import axios from 'axios' // We'll use axios directly or add to api.js later

// Temporary API helper inside component for simplicity or we can use usersAPI
// Let's use axios directly to avoid modifying api.js again for now, or just use the endpoints!
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

export default function ChatModal({ isOpen, onClose, conversationId, title = 'Chat', apiPath = 'conversations' }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!isOpen || !conversationId) return

    const fetchMessages = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('grihastha_token')
        const { data } = await axios.get(`${API_BASE_URL}/v1/${apiPath}/${conversationId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (data?.success) {
          setMessages(data.data)
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err)
        showToast('Failed to load messages.', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()

    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [isOpen, conversationId, showToast, apiPath])

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const token = localStorage.getItem('grihastha_token')
      const { data } = await axios.post(`${API_BASE_URL}/v1/${apiPath}/${conversationId}/messages`, 
        { text: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data?.success) {
        setMessages([...messages, data.data])
        setNewMessage('')
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      showToast('Failed to send message.', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, backdropFilter: 'blur(4px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed', bottom: 20, right: 20,
              width: 380, height: 500,
              background: '#fff', borderRadius: 20,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)',
              zIndex: 101, display: 'flex', flexDirection: 'column',
              overflow: 'hidden', border: '1.5px solid #e5e7eb'
            }}
          >
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #093880, #1a56c4)', padding: '16px 20px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
                <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Admin Support</p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
                <FiX size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loading && messages.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <div style={{ width: 24, height: 24, border: '3px solid #e2e8f0', borderTopColor: '#093880', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 'auto', marginBottom: 'auto' }}>
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user?.id || (user?.role === 'admin' && msg.sender_admin_id)
                  // Wait, on guest side, user is guest. So msg.sender_id === user.id is ME!
                  // Admin messages will have sender_admin_id!
                  const isAdminMsg = !!msg.sender_admin_id

                  return (
                    <div key={msg.id || idx} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '75%',
                        padding: '10px 14px',
                        borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                        background: isMe ? '#093880' : isAdminMsg ? '#e0f2fe' : '#fff',
                        color: isMe ? '#fff' : '#1e293b',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        fontSize: 13,
                        border: isMe ? 'none' : '1px solid #e2e8f0'
                      }}>
                        {!isMe && (
                          <div style={{ fontSize: 10, fontWeight: 700, color: isAdminMsg ? '#0369a1' : '#64748b', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {isAdminMsg ? <><FiServer size={10} /> Admin</> : <><FiUser size={10} /> Guest</>}
                          </div>
                        )}
                        <div style={{ wordBreak: 'break-word' }}>{msg.text}</div>
                        <div style={{ fontSize: 9, opacity: 0.7, textAlign: 'right', marginTop: 4 }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} style={{ padding: '16px', background: '#fff', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 10 }}>
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 999,
                  border: '1.5px solid #e5e7eb', fontSize: 13,
                  outline: 'none', transition: 'all 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#093880'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #093880, #1a56c4)',
                  color: '#fff', border: 'none', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                  opacity: sending || !newMessage.trim() ? 0.6 : 1
                }}
              >
                <FiSend size={16} />
              </button>
            </form>
          </motion.div>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AnimatePresence>
  )
}
