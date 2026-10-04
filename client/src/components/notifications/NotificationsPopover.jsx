import React, { useState, useEffect, useRef } from 'react'
import { Bell, Check, CheckCheck, Clock, ExternalLink, AlertTriangle, Sparkles, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function NotificationsPopover() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const popoverRef = useRef(null)
  const navigate = useNavigate()

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await api.get('/notifications')
      const data = res.data?.data || res.data || {}
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll notifications every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleMarkAsRead = async (id, link) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
      if (link) {
        setOpen(false)
        navigate(link)
      }
    } catch (err) {
      console.error('Failed to mark read:', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all read:', err)
    }
  }

  const getIcon = (type) => {
    if (type === 'ACTION_REQUIRED' || type === 'OVERDUE') {
      return <AlertTriangle size={15} style={{ color: '#d97706' }} />
    }
    if (type === 'COMPLETED') {
      return <Check size={15} style={{ color: '#16a34a' }} />
    }
    return <Sparkles size={15} style={{ color: 'var(--blue)' }} />
  }

  return (
    <div className="notif-wrapper" ref={popoverRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="icon-button"
        aria-label="Notifications"
        title="Project Notifications"
        onClick={() => {
          setOpen(!open)
          if (!open) fetchNotifications()
        }}
        style={{ position: 'relative' }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              background: '#ef4444',
              color: 'white',
              fontSize: '10px',
              fontWeight: 800,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="notif-dropdown panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '360px',
            maxWidth: '90vw',
            maxHeight: '480px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 12px 32px rgba(20, 33, 61, 0.18)',
            padding: 0,
            borderRadius: '12px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid var(--line)',
              background: '#fafcff'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '14px' }}>Notifications</strong>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'var(--blue-soft)',
                    color: 'var(--blue)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: 'var(--blue)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                Checking for updates…
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                <Bell size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <p style={{ margin: 0, fontSize: '13px' }}>No notifications yet</p>
                <small style={{ fontSize: '11px' }}>Project progress alerts will appear here</small>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleMarkAsRead(item.id, item.link)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--line)',
                    background: item.isRead ? 'white' : '#f0f5ff',
                    cursor: item.link ? 'pointer' : 'default',
                    transition: 'background 0.15s ease',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = item.isRead ? '#f9fafb' : '#e6efff' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = item.isRead ? 'white' : '#f0f5ff' }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: item.isRead ? 'var(--surface)' : 'white',
                      border: '1px solid var(--line)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    {getIcon(item.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px' }}>
                      <strong
                        style={{
                          fontSize: '13px',
                          color: item.isRead ? 'var(--ink)' : 'var(--blue-dark)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.title}
                      </strong>
                      {!item.isRead && (
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'var(--blue)',
                            flexShrink: 0
                          }}
                        />
                      )}
                    </div>
                    <p
                      style={{
                        margin: '3px 0 6px',
                        fontSize: '12px',
                        color: 'var(--ink)',
                        lineHeight: 1.4,
                        wordBreak: 'break-word'
                      }}
                    >
                      {item.message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--muted)' }}>
                      <Clock size={11} />
                      <span>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      {item.link && (
                        <span style={{ color: 'var(--blue)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px', marginLeft: 'auto' }}>
                          View <ExternalLink size={10} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
