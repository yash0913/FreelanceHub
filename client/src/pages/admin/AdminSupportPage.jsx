import { useEffect, useState } from 'react'
import {
  Check,
  CheckCircle2,
  Clock,
  Filter,
  LifeBuoy,
  MessageSquare,
  RefreshCw,
  Search,
  Tag,
  User,
  X
} from 'lucide-react'
import api from '../../services/api'

const unwrap = (res) => res?.data?.data ?? res?.data ?? res

const dateLabel = (val) => {
  if (!val) return 'Date unavailable'
  const d = new Date(val)
  return Number.isNaN(d.getTime())
    ? 'Date unavailable'
    : d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedTicket, setSelectedTicket] = useState(null)

  // Edit ticket state
  const [editStatus, setEditStatus] = useState('OPEN')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveError, setSaveError] = useState('')

  const loadTickets = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (statusFilter !== 'ALL') params.status = statusFilter
      const res = await api.get('/admin/support/tickets', { params })
      setTickets(unwrap(res) || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load support queue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [statusFilter])

  const openTicketDetail = (ticket) => {
    setSelectedTicket(ticket)
    setEditStatus(ticket.status)
    setEditNotes(ticket.adminNotes || '')
    setSaveSuccess('')
    setSaveError('')
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedTicket) return
    setSaving(true)
    setSaveSuccess('')
    setSaveError('')
    try {
      const res = await api.patch(`/admin/support/tickets/${selectedTicket.id}`, {
        status: editStatus,
        adminNotes: editNotes
      })
      const updated = unwrap(res)
      setSaveSuccess('Support ticket updated successfully!')
      setSelectedTicket(updated)
      loadTickets()
    } catch (err) {
      setSaveError(err?.response?.data?.message || 'Failed to update ticket')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-support-page">
      <div className="page-intro" style={{ marginBottom: '22px' }}>
        <div>
          <div className="eyebrow">Operations & Moderation</div>
          <h1>Customer Care & Support Queue</h1>
          <p>
            Review tickets filed by customers and freelancers, assign investigation notes, and provide resolution updates.
          </p>
        </div>
        <button
          className="button button-outline button-small"
          onClick={loadTickets}
          type="button"
        >
          <RefreshCw size={14} /> Refresh Queue
        </button>
      </div>

      {/* Filter Row */}
      <div className="frw-filter-row" style={{ marginBottom: '20px' }}>
        {['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'].map((st) => (
          <button
            key={st}
            type="button"
            className={`frw-filter ${statusFilter === st ? 'active' : ''}`}
            onClick={() => setStatusFilter(st)}
          >
            {st === 'ALL' ? 'All Tickets' : st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="panel" style={{ padding: '40px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p className="muted">Loading support queue…</p>
        </div>
      ) : error ? (
        <div className="panel" style={{ padding: '24px', borderLeft: '4px solid #d93838' }}>
          <strong>Error loading queue:</strong> {error}
        </div>
      ) : tickets.length === 0 ? (
        <div className="panel" style={{ padding: '48px', textAlign: 'center' }}>
          <LifeBuoy size={40} style={{ color: '#9aa6b7', margin: '0 auto 12px' }} />
          <h3>Support queue is clear</h3>
          <p className="muted">There are no support tickets matching the selected filter.</p>
        </div>
      ) : (
        <div className="panel data-list">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="data-row"
              style={{ cursor: 'pointer', transition: 'background .15s' }}
              onClick={() => openTicketDetail(t)}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: t.status === 'RESOLVED' || t.status === 'CLOSED' ? '#e7f8f0' : 'var(--blue-soft)',
                  color: t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'var(--green)' : 'var(--blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <LifeBuoy size={18} />
              </div>

              <div className="data-row-copy" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong>{t.subject}</strong>
                  <span className={`status status-${t.status?.toLowerCase()}`}>{t.status}</span>
                  <span style={{ fontSize: '10px', background: '#f0f4f9', padding: '2px 6px', borderRadius: '4px' }}>
                    {t.priority}
                  </span>
                </div>
                <span>
                  Requester: <strong>{t.user?.name}</strong> ({t.user?.role}) · Category: {t.category} · Filed {dateLabel(t.createdAt)}
                </span>
                {t.adminNotes && (
                  <small style={{ color: '#687890' }}>
                    Resolution note: {t.adminNotes}
                  </small>
                )}
              </div>

              <button
                className="button button-outline button-small"
                onClick={(e) => {
                  e.stopPropagation()
                  openTicketDetail(t)
                }}
                type="button"
              >
                Manage
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TICKET DETAIL & RESOLUTION MODAL */}
      {selectedTicket && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(20,33,61,.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <div
            className="panel"
            style={{
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0,0,0,.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <div className="eyebrow">Ticket #{selectedTicket.id} · {selectedTicket.category}</div>
                <h2 style={{ fontSize: '19px', margin: '2px 0 0' }}>{selectedTicket.subject}</h2>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                style={{ background: 'none', border: 0, cursor: 'pointer' }}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            {/* Requester Facts */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '14px 18px',
                marginBottom: '16px',
                fontSize: '12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px'
              }}
            >
              <div>
                <span style={{ color: '#8898aa', display: 'block', fontSize: '10px' }}>REQUESTER</span>
                <strong>{selectedTicket.user?.name}</strong>
              </div>
              <div>
                <span style={{ color: '#8898aa', display: 'block', fontSize: '10px' }}>EMAIL</span>
                <span>{selectedTicket.user?.email}</span>
              </div>
              <div>
                <span style={{ color: '#8898aa', display: 'block', fontSize: '10px' }}>ROLE</span>
                <span className={`status status-${selectedTicket.user?.role?.toLowerCase()}`}>{selectedTicket.user?.role}</span>
              </div>
              <div>
                <span style={{ color: '#8898aa', display: 'block', fontSize: '10px' }}>PRIORITY</span>
                <strong>{selectedTicket.priority}</strong>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '18px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Issue Description
              </span>
              <p style={{ background: 'white', border: '1px solid #eef2f7', borderRadius: '7px', padding: '12px 14px', fontSize: '13px', lineHeight: 1.6, marginTop: '6px', color: '#334155' }}>
                {selectedTicket.description}
              </p>
            </div>

            {selectedTicket.relatedProject && (
              <div style={{ marginBottom: '18px', fontSize: '12px', color: 'var(--muted)' }}>
                Related Project: <strong>{selectedTicket.relatedProject.title}</strong>
              </div>
            )}

            {saveSuccess && <div className="success-banner" style={{ marginBottom: '14px' }}><Check size={16} />{saveSuccess}</div>}
            {saveError && <div className="form-alert" style={{ marginBottom: '14px' }}>{saveError}</div>}

            {/* Admin Response & Status Form */}
            <form onSubmit={handleUpdate} style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>
                    Ticket Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid var(--line)', fontSize: '13px' }}
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="WAITING_FOR_USER">WAITING FOR USER</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>
                  Admin Notes & Resolution Details (Visible to Requester)
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain steps taken, solution provided, or instructions for the user..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid var(--line)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setSelectedTicket(null)}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save & Update Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
