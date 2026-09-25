import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Clock,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldAlert,
  UserCheck
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const unwrap = (res) => res?.data?.data ?? res?.data ?? res

const dateLabel = (val) => {
  if (!val) return ''
  const d = new Date(val)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' +
      d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const toId = (value) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const findParticipantUser = (conv, userId) =>
  conv?.participants?.find((p) => toId(p.userId) === userId || toId(p.user?.id) === userId)?.user || null

/**
 * Resolve the other person in a conversation.
 * Never returns the logged-in user.
 */
const getCounterparty = (conv, currentUserId) => {
  if (!conv || !currentUserId) return null

  const presented = conv.counterparty
  if (presented && toId(presented.id) && toId(presented.id) !== currentUserId) {
    return presented
  }

  const collab1Id = toId(conv.collabFreelancer1Id)
  const collab2Id = toId(conv.collabFreelancer2Id)
  if (collab1Id && collab2Id) {
    if (currentUserId === collab1Id) {
      return conv.collabFreelancer2 || findParticipantUser(conv, collab2Id)
    }
    if (currentUserId === collab2Id) {
      return conv.collabFreelancer1 || findParticipantUser(conv, collab1Id)
    }
    return null
  }

  const freelancerId = toId(conv.freelancerId)
  const customerId = toId(conv.customerId)
  if (customerId && freelancerId) {
    if (currentUserId === customerId) {
      return conv.freelancer || findParticipantUser(conv, freelancerId)
    }
    if (currentUserId === freelancerId) {
      return conv.customer || findParticipantUser(conv, customerId)
    }
    return null
  }

  const others = (conv.participants || [])
    .map((p) => p.user)
    .filter((u) => u && toId(u.id) && toId(u.id) !== currentUserId)
  return others.length === 1 ? others[0] : null
}

const conversationDedupeKey = (conv) => {
  const collab1Id = toId(conv.collabFreelancer1Id)
  const collab2Id = toId(conv.collabFreelancer2Id)
  if (collab1Id && collab2Id) return `ff:${collab1Id}:${collab2Id}`
  const customerId = toId(conv.customerId)
  const freelancerId = toId(conv.freelancerId)
  if (customerId && freelancerId) return `cf:${customerId}:${freelancerId}`
  return `id:${conv.id}`
}

const dedupeConversations = (list) => {
  const map = new Map()
  for (const conv of list) {
    const key = conversationDedupeKey(conv)
    const existing = map.get(key)
    if (!existing || new Date(conv.updatedAt) >= new Date(existing.updatedAt)) {
      map.set(key, conv)
    }
  }
  return [...map.values()].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export default function MessagesPage() {
  const { user } = useAuth()
  const currentUserId = toId(user?.id)
  const [searchParams, setSearchParams] = useSearchParams()
  const initialConvId = toId(searchParams.get('conversation'))

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeConvId, setActiveConvId] = useState(initialConvId)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [messagesError, setMessagesError] = useState('')
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')

  const scrollRef = useRef(null)

  // Fetch all conversations belonging to the authenticated user (DB is source of truth)
  const loadConversations = async (silent = false) => {
    if (!currentUserId) return
    if (!silent) setLoading(true)
    setError('')
    try {
      const res = await api.get('/conversations')
      const list = Array.isArray(unwrap(res)) ? unwrap(res) : []
      const visibleList = dedupeConversations(list).filter((conv) => {
        const other = getCounterparty(conv, currentUserId)
        return !!other && toId(other.id) !== currentUserId
      })
      setConversations(visibleList)

      setActiveConvId((current) => {
        if (current && visibleList.some((c) => c.id === current)) return current
        if (initialConvId && visibleList.some((c) => c.id === initialConvId)) return initialConvId
        if (visibleList.length > 0) return visibleList[0].id
        return null
      })
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load conversations')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    if (!currentUserId) return
    loadConversations()
  }, [currentUserId])

  // When initialConvId changes from URL
  useEffect(() => {
    if (initialConvId) {
      setActiveConvId(initialConvId)
    }
  }, [initialConvId])

  // Fetch messages for active conversation
  const loadMessages = async (convId, silent = false) => {
    if (!convId) return
    if (!silent) setLoadingMessages(true)
    setMessagesError('')
    try {
      const res = await api.get(`/conversations/${convId}/messages`)
      const list = unwrap(res) || []
      setMessages(list)
    } catch (err) {
      setMessagesError(
        err?.response?.status === 404
          ? 'Conversation not found or access denied.'
          : err?.response?.data?.message || 'Unable to load messages'
      )
    } finally {
      if (!silent) setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId)
      // Sync URL
      setSearchParams({ conversation: activeConvId }, { replace: true })
    }
  }, [activeConvId])

  // Polling for incoming messages every 6s
  useEffect(() => {
    if (!activeConvId) return
    const interval = setInterval(() => {
      loadMessages(activeConvId, true)
      loadConversations(true)
    }, 6000)
    return () => clearInterval(interval)
  }, [activeConvId])

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loadingMessages])

  // Send message
  const handleSend = async (e) => {
    e.preventDefault()
    const content = inputText.trim()
    if (!content || !activeConvId || sending) return

    setSending(true)
    try {
      const res = await api.post(`/conversations/${activeConvId}/messages`, { content })
      const newMsg = unwrap(res)
      setMessages((prev) => [...prev, newMsg])
      setInputText('')
      loadConversations(true)
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const visibleConversations = conversations
  const activeConversation = visibleConversations.find((c) => c.id === activeConvId)
  const counterparty = getCounterparty(activeConversation, currentUserId)

  const filteredConversations = visibleConversations.filter((c) => {
    if (!searchFilter.trim()) return true
    const other = getCounterparty(c, currentUserId)
    const q = searchFilter.toLowerCase()
    return (
      other?.name?.toLowerCase().includes(q) ||
      other?.professionalTitle?.toLowerCase().includes(q) ||
      other?.role?.toLowerCase().includes(q)
    )
  })


  return (
    <div className="messages-workspace-page">
      <div className="page-intro" style={{ marginBottom: '20px' }}>
        <div>
          <div className="eyebrow">Direct Communications</div>
          <h1>Messages & Discussions</h1>
          <p>
            {user?.role === 'CUSTOMER'
              ? 'Chat directly with the freelancers you hire.'
              : 'Chat directly with your clients.'}
          </p>
        </div>
        <button
          className="button button-outline button-small"
          onClick={() => {
            loadConversations(true)
            if (activeConvId) loadMessages(activeConvId, true)
          }}
          title="Refresh messages"
          type="button"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="panel" style={{ padding: '36px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p className="muted">Loading your conversations…</p>
        </div>
      ) : error ? (
        <div className="panel" style={{ padding: '24px', borderLeft: '4px solid #d93838' }}>
          <strong>Error loading conversations:</strong> {error}
        </div>
      ) : (
        <div className="messaging-layout">
          {/* Left: Conversation list */}
          <aside className="panel conversation-list">
            <div className="conversation-heading">
              <span>Inbox ({filteredConversations.length})</span>
              <span className="muted">End-to-end verified</span>
            </div>

            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line)' }}>
              <input
                type="text"
                placeholder="Search conversations…"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '12px',
                  padding: '7px 11px',
                  borderRadius: '7px',
                  border: '1px solid var(--line)'
                }}
              />
            </div>

            <div className="conversation-scroll">
              {filteredConversations.length === 0 ? (
                <div style={{ padding: '28px 16px', textAlign: 'center', color: '#9aa6b7' }}>
                  <MessageSquare size={24} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                  <p style={{ fontSize: '12px', margin: 0 }}>
                    {conversations.length === 0
                      ? 'No conversations yet.'
                      : 'No matching conversations.'}
                  </p>
                  {conversations.length === 0 && (
                    <small style={{ display: 'block', marginTop: '6px', fontSize: '10px' }}>
                      Start chats from project briefs or talent profiles.
                    </small>
                  )}
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const otherUser = getCounterparty(conv, currentUserId)
                  const lastMsg = conv.messages?.[0]
                  const isSelected = conv.id === activeConvId

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      className={`conversation-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => setActiveConvId(conv.id)}
                    >
                      <div
                        className="conversation-avatar"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: isSelected ? 'var(--blue)' : 'var(--blue-soft)',
                          color: isSelected ? '#fff' : 'var(--blue)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '14px',
                          flexShrink: 0
                        }}
                      >
                        {otherUser?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>{otherUser?.name || 'User'}</strong>
                          <small style={{ fontSize: '9px', color: '#9aa6b7' }}>
                            {dateLabel(conv.updatedAt).split('·')[0]}
                          </small>
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--muted)', display: 'block' }}>
                          {otherUser?.professionalTitle || otherUser?.role || 'Member'}
                        </span>
                        <p
                          style={{
                            margin: '3px 0 0',
                            fontSize: '11px',
                            color: isSelected ? 'var(--ink)' : '#66738c',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {lastMsg ? (
                            <>
                              {toId(lastMsg.senderId) === currentUserId ? 'You: ' : ''}
                              {lastMsg.content}
                            </>
                          ) : (
                            <em style={{ color: '#aab4c4' }}>No messages yet</em>
                          )}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </aside>

          {/* Right: Active chat panel */}
          <main className="panel chat-panel">
            {activeConvId && counterparty ? (
              <>
                <header className="chat-header">
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'var(--blue)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '14px'
                    }}
                  >
                    {counterparty?.name?.charAt(0) || 'U'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong>{counterparty?.name || 'Counterparty'}</strong>
                      <span
                        className={`status status-${counterparty?.role?.toLowerCase() || 'customer'}`}
                        style={{ fontSize: '9px', padding: '2px 7px' }}
                      >
                        {counterparty?.role}
                      </span>
                    </div>
                    <span>{counterparty?.professionalTitle || counterparty?.email}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <UserCheck size={14} color="#17825b" />
                    <span>Verified Counterparty</span>
                  </div>
                </header>

                {loadingMessages ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner" />
                  </div>
                ) : messagesError ? (
                  <div style={{ padding: '32px', textAlign: 'center' }}>
                    <ShieldAlert size={32} color="#d93838" style={{ margin: '0 auto 10px' }} />
                    <strong style={{ color: '#d93838', display: 'block' }}>{messagesError}</strong>
                  </div>
                ) : (
                  <div className="messages-scroll" ref={scrollRef}>
                    {messages.length === 0 ? (
                      <div className="chat-empty">
                        <MessageSquare size={32} />
                        <p>No messages in this conversation yet.</p>
                        <small>Send a greeting to start collaborating.</small>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMine = toId(msg.senderId) === currentUserId
                        return (
                          <div
                            key={msg.id}
                            className={`message-bubble ${isMine ? 'mine' : ''}`}
                          >
                            <p>{msg.content}</p>
                            <small>
                              {dateLabel(msg.sentAt)}
                              {isMine && (
                                <span style={{ marginLeft: '6px' }}>
                                  {msg.isRead ? '· Read' : '· Sent'}
                                </span>
                              )}
                            </small>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}

                <form className="chat-compose" onSubmit={handleSend}>
                  <input
                    type="text"
                    placeholder="Type your message… (Press Enter to send)"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={sending || Boolean(messagesError)}
                  />
                  <button
                    className="button button-primary"
                    disabled={!inputText.trim() || sending || Boolean(messagesError)}
                    type="submit"
                    aria-label="Send message"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </>
            ) : (
              <div className="chat-empty" style={{ minHeight: '440px' }}>
                <MessageSquare size={48} style={{ opacity: 0.4 }} />
                <h3>Select a conversation</h3>
                <p>Choose a thread from the inbox to read and send messages.</p>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  )
}
