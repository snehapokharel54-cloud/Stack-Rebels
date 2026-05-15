import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiSend, FiUser, FiServer, FiArrowLeft, FiMessageSquare } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Navbar from '../components/Navbar'
import axios from 'axios'
import CryptoJS from 'crypto-js'
import { io } from 'socket.io-client'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'
const SECRET_KEY = 'grihastha_default_secret_key'

export default function MessagesPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialConvId = searchParams.get('id')

  const [conversations, setConversations] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingConv, setLoadingConv] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [socket, setSocket] = useState(null)
  const typingTimeoutRef = useRef(null)
  const [isLocalTyping, setIsLocalTyping] = useState(false)

  const messagesEndRef = useRef(null)

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setLoadingConv(true)
      try {
        const token = localStorage.getItem('grihastha_token')
        const { data } = await axios.get(`${API_BASE_URL}/v1/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (data?.success) {
          setConversations(data.data)
          // If initialConvId is provided, select it!
          if (initialConvId) {
            const found = data.data.find(c => c.id === initialConvId)
            if (found) setSelectedConv(found)
          } else if (data.data.length > 0) {
            setSelectedConv(data.data[0])
          }
        }
      } catch (err) {
        console.error('Failed to fetch conversations:', err)
        showToast('Failed to load conversations.', 'error')
      } finally {
        setLoadingConv(false)
      }
    }

    fetchConversations()
  }, [initialConvId, showToast])

  // Socket.io connection
  useEffect(() => {
    const s = io(API_BASE_URL)
    setSocket(s)
    
    s.on('connect', () => {
      console.log('[SOCKET] Connected to server')
    })
    
    return () => s.disconnect()
  }, [])

  // Fetch messages when selected conversation changes
  useEffect(() => {
    if (!selectedConv || !socket) return
    
    setMessages([])
    
    // Join conversation room
    socket.emit('join_conversation', selectedConv.id)
    
    const fetchMessages = async () => {
      setLoadingMsg(true)
      try {
        const token = localStorage.getItem('grihastha_token')
        const { data } = await axios.get(`${API_BASE_URL}/v1/conversations/${selectedConv.id}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (data?.success) {
          const decryptedMessages = data.data.map(msg => {
            try {
              const bytes = CryptoJS.AES.decrypt(msg.content, SECRET_KEY)
              const decryptedText = bytes.toString(CryptoJS.enc.Utf8)
              return { ...msg, content: decryptedText || msg.content }
            } catch (e) { return msg }
          })
          setMessages(decryptedMessages)
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err)
        showToast('Failed to load messages.', 'error')
      } finally {
        setLoadingMsg(false)
      }
    }
    
    fetchMessages()
    
    const handleReceiveMessage = (data) => {
      console.log('[SOCKET] Received message:', data)
      // Decrypt message
      let decryptedContent = data.content
      try {
        const bytes = CryptoJS.AES.decrypt(data.content, SECRET_KEY)
        const text = bytes.toString(CryptoJS.enc.Utf8)
        decryptedContent = text || data.content
      } catch (e) {}
      
      setMessages(prev => [...prev, { ...data, content: decryptedContent }])
    }
    
    const handleUserTyping = (data) => {
      if (data.sender_id !== user?.id) {
        setIsTyping(true)
      }
    }
    
    const handleUserStopTyping = (data) => {
      if (data.sender_id !== user?.id) {
        setIsTyping(false)
      }
    }
    
    socket.on('receive_message', handleReceiveMessage)
    socket.on('user_typing', handleUserTyping)
    socket.on('user_stop_typing', handleUserStopTyping)
    
    return () => {
      socket.off('receive_message', handleReceiveMessage)
      socket.off('user_typing', handleUserTyping)
      socket.off('user_stop_typing', handleUserStopTyping)
    }
  }, [selectedConv, socket, showToast, user?.id])

  const handleInputChange = (e) => {
    setNewMessage(e.target.value)
    
    if (socket && selectedConv) {
      // Only emit typing if we haven't already
      if (!isLocalTyping) {
        setIsLocalTyping(true)
        socket.emit('typing', { conversationId: selectedConv.id, sender_id: user?.id })
      }
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { conversationId: selectedConv.id, sender_id: user?.id })
        setIsLocalTyping(false)
      }, 2000)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConv) return

    setSending(true)
    try {
      const token = localStorage.getItem('grihastha_token')
      const encryptedText = CryptoJS.AES.encrypt(newMessage.trim(), SECRET_KEY).toString()
      
      const { data } = await axios.post(`${API_BASE_URL}/v1/conversations/${selectedConv.id}/messages`, 
        { text: encryptedText },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data?.success) {
        // Add the decrypted message to state for immediate display
        setMessages([...messages, { ...data.data, content: newMessage.trim() }])
        setNewMessage('')
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      showToast('Failed to send message.', 'error')
    } finally {
      setSending(false)
    }
  }
  const handleStartAdminChat = async () => {
    try {
      const token = localStorage.getItem('grihastha_token')
      const { data } = await axios.post(`${API_BASE_URL}/v1/conversations`, 
        {}, // Empty body means hostId is NULL!
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data?.success) {
        showToast("Opening chat with Admin Support...", "success")
        // Refresh conversations to see the new one!
        const response = await axios.get(`${API_BASE_URL}/v1/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.data?.success) {
          setConversations(response.data.data)
          const found = response.data.data.find(c => c.id === data.id)
          if (found) setSelectedConv(found)
        }
      }
    } catch (err) {
      console.error('Failed to start admin chat:', err)
      showToast('Failed to start admin chat.', 'error')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <main style={{ flex: 1, display: 'flex', maxWidth: 1200, width: '100%', margin: '20px auto', background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1.5px solid #e5e7eb' }}>
        
        {/* Sidebar */}
        <div style={{ width: 320, borderRight: '1.5px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1.5px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: "'Poppins', sans-serif", color: '#0f172a' }}>Messages</h2>
            <button
              onClick={handleStartAdminChat}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                background: '#e0f2fe',
                color: '#0369a1',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.target.style.background = '#bae6fd'}
              onMouseLeave={e => e.target.style.background = '#e0f2fe'}
            >
              Support
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingConv ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Loading...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                No conversations yet.
              </div>
            ) : (
              conversations.map(conv => {
                const isDispute = !conv.host_id
                const otherName = isDispute ? 'Admin Support' : (conv.guest_id === user?.id ? conv.host_name : conv.guest_name)
                const avatarUrl = isDispute ? null : (conv.guest_id === user?.id ? conv.host_avatar : conv.guest_avatar)
                const isSelected = selectedConv?.id === conv.id

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      background: isSelected ? '#f1f5f9' : 'transparent',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: isDispute ? '#e0f2fe' : '#093880', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDispute ? '#0369a1' : '#fff', fontWeight: 700, fontSize: 14 }}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={otherName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : isDispute ? (
                        <FiServer size={18} />
                      ) : (
                        otherName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {otherName}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.listing_title || 'Dispute'}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
          {selectedConv ? (
            <>
              {/* Header */}
              <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: !selectedConv.host_id ? '#e0f2fe' : '#093880', display: 'flex', alignItems: 'center', justifyContent: 'center', color: !selectedConv.host_id ? '#0369a1' : '#fff', fontWeight: 700, fontSize: 14 }}>
                  {!selectedConv.host_id ? (
                    <FiServer size={18} />
                  ) : (selectedConv.guest_id === user?.id ? selectedConv.host_avatar : selectedConv.guest_avatar) ? (
                    <img src={selectedConv.guest_id === user?.id ? selectedConv.host_avatar : selectedConv.guest_avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (selectedConv.guest_id === user?.id ? selectedConv.host_name : selectedConv.guest_name).charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                    {!selectedConv.host_id ? 'Admin Support' : (selectedConv.guest_id === user?.id ? selectedConv.host_name : selectedConv.guest_name)}
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{selectedConv.listing_title || 'Dispute Ticket'}</p>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {loadingMsg && messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#64748b' }}>Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14, marginTop: 'auto', marginBottom: 'auto' }}>
                    No messages yet.
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user?.id || (user?.role === 'admin' && msg.sender_admin_id)
                    const isAdminMsg = !!msg.sender_admin_id

                    return (
                      <div key={msg.id || idx} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '70%',
                          padding: '10px 14px',
                          borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                          background: isMe ? '#093880' : isAdminMsg ? '#e0f2fe' : '#fff',
                          color: isMe ? '#fff' : '#1e293b',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          fontSize: 13,
                          border: isMe ? 'none' : '1px solid #e2e8f0'
                        }}>
                          {!isMe && (
                            <div style={{ fontSize: 10, fontWeight: 700, color: isAdminMsg ? '#0369a1' : '#64748b', marginBottom: 2 }}>
                              {isAdminMsg ? 'Admin' : 'Host'}
                            </div>
                          )}
                          <div style={{ wordBreak: 'break-word' }}>{msg.content}</div>
                          <div style={{ fontSize: 9, opacity: 0.7, textAlign: 'right', marginTop: 4 }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                {isTyping && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 2px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b' }}
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} style={{ padding: '16px', background: '#fff', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="Type your message..."
                  style={{
                    flex: 1, padding: '12px 16px', borderRadius: 999,
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
                    width: 42, height: 42, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #093880, #1a56c4)',
                    color: '#fff', border: 'none', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s',
                    opacity: sending || !newMessage.trim() ? 0.6 : 1
                  }}
                >
                  <FiSend size={18} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <FiMessageSquare size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <p style={{ fontSize: 15, fontWeight: 600 }}>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
