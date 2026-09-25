import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Ban,
  Check,
  CheckCircle,
  ExternalLink,
  Eye,
  Flag,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  UserX,
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

export default function AdminReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedReport, setSelectedReport] = useState(null)

  // Moderation action state
  const [editStatus, setEditStatus] = useState('UNDER_REVIEW')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveError, setSaveError] = useState('')
  const [blockLoading, setBlockLoading] = useState(false)

  const loadReports = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (statusFilter !== 'ALL') params.status = statusFilter
      const res = await api.get('/admin/reports', { params })
      setReports(unwrap(res) || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load moderation reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [statusFilter])

  const openReportDetail = (report) => {
    setSelectedReport(report)
    setEditStatus(report.status)
    setResolutionNotes(report.resolutionNotes || '')
    setSaveSuccess('')
    setSaveError('')
  }

  const handleUpdateReport = async (e) => {
    e.preventDefault()
    if (!selectedReport) return
    setSaving(true)
    setSaveSuccess('')
    setSaveError('')
    try {
      const res = await api.patch(`/admin/reports/${selectedReport.id}`, {
        status: editStatus,
        resolutionNotes
      })
      const updated = unwrap(res)
      setSaveSuccess('Report resolution updated successfully!')
      setSelectedReport(updated)
      loadReports()
    } catch (err) {
      setSaveError(err?.response?.data?.message || 'Failed to update report')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleBlockUser = async (userId, willBlock) => {
    const action = willBlock ? 'block' : 'unblock'
    if (!window.confirm(`Are you sure you want to ${action} this user account?`)) return

    setBlockLoading(true)
    try {
      await api.patch(`/admin/users/${userId}/${action}`)
      alert(`User has been ${action}ed.`)
      loadReports()
    } catch (err) {
      alert(err?.response?.data?.message || `Failed to ${action} user`)
    } finally {
      setBlockLoading(false)
    }
  }

  return (
    <div className="admin-reports-page">
      <div className="page-intro" style={{ marginBottom: '22px' }}>
        <div>
          <div className="eyebrow">Trust & Safety Operations</div>
          <h1>Moderation & Fraud Reports</h1>
          <p>
            Investigate reported user accounts, assess platform policy violations, and log formal resolution decisions.
          </p>
        </div>
        <button
          className="button button-outline button-small"
          onClick={loadReports}
          type="button"
        >
          <RefreshCw size={14} /> Refresh Queue
        </button>
      </div>

      {/* Filter Row */}
      <div className="frw-filter-row" style={{ marginBottom: '20px' }}>
        {['ALL', 'PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].map((st) => (
          <button
            key={st}
            type="button"
            className={`frw-filter ${statusFilter === st ? 'active' : ''}`}
            onClick={() => setStatusFilter(st)}
          >
            {st === 'ALL' ? 'All Reports' : st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="panel" style={{ padding: '40px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p className="muted">Loading moderation queue…</p>
        </div>
      ) : error ? (
        <div className="panel" style={{ padding: '24px', borderLeft: '4px solid #d93838' }}>
          <strong>Error:</strong> {error}
        </div>
      ) : reports.length === 0 ? (
        <div className="panel" style={{ padding: '48px', textAlign: 'center' }}>
          <Flag size={40} style={{ color: '#9aa6b7', margin: '0 auto 12px' }} />
          <h3>Moderation queue is clear</h3>
          <p className="muted">No user reports currently pending in this status filter.</p>
        </div>
      ) : (
        <div className="panel data-list">
          {reports.map((r) => (
            <div
              key={r.id}
              className="data-row"
              style={{ cursor: 'pointer', transition: 'background .15s' }}
              onClick={() => openReportDetail(r)}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: r.status === 'RESOLVED' ? '#e7f8f0' : r.status === 'DISMISSED' ? '#f4f6fa' : '#fff3dc',
                  color: r.status === 'RESOLVED' ? 'var(--green)' : r.status === 'DISMISSED' ? '#8898aa' : 'var(--amber)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Flag size={18} />
              </div>

              <div className="data-row-copy" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong>{r.reason}</strong>
                  <span className={`status status-${r.status?.toLowerCase()}`}>{r.status}</span>
                </div>
                <span>
                  Reported: <strong>{r.reportedUser?.name}</strong> ({r.reportedUser?.role}) by <strong>{r.reporter?.name}</strong> ({r.reporter?.role}) · Filed {dateLabel(r.createdAt)}
                </span>
                {r.description && (
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#55637d', lineHeight: 1.5 }}>
                    “{r.description}”
                  </p>
                )}
                {r.resolutionNotes && (
                  <small style={{ color: 'var(--blue)', marginTop: '4px' }}>
                    Resolution: {r.resolutionNotes}
                  </small>
                )}
              </div>

              <button
                className="button button-outline button-small"
                onClick={(e) => {
                  e.stopPropagation()
                  openReportDetail(r)
                }}
                type="button"
              >
                Review
              </button>
            </div>
          ))}
        </div>
      )}

      {/* REPORT DETAIL & RESOLUTION MODAL */}
      {selectedReport && (
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
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0,0,0,.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <div className="eyebrow">Report #{selectedReport.id}</div>
                <h2 style={{ fontSize: '19px', margin: '2px 0 0' }}>{selectedReport.reason}</h2>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                style={{ background: 'none', border: 0, cursor: 'pointer' }}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            {/* Parties Involved */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                background: '#f8fafc',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '14px 18px',
                marginBottom: '16px',
                fontSize: '12px'
              }}
            >
              <div>
                <span style={{ color: '#8898aa', display: 'block', fontSize: '10px' }}>REPORTED PARTY</span>
                <strong>{selectedReport.reportedUser?.name}</strong>
                <div style={{ marginTop: '2px', color: 'var(--muted)' }}>
                  {selectedReport.reportedUser?.email} · {selectedReport.reportedUser?.role}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <button
                    className="button button-outline button-small"
                    style={{ color: '#d93838', borderColor: '#fca5a5' }}
                    onClick={() => handleToggleBlockUser(selectedReport.reportedUserId, true)}
                    disabled={blockLoading}
                    type="button"
                  >
                    <Ban size={13} /> Block User Account
                  </button>
                </div>
              </div>

              <div>
                <span style={{ color: '#8898aa', display: 'block', fontSize: '10px' }}>FILED BY (REPORTER)</span>
                <strong>{selectedReport.reporter?.name}</strong>
                <div style={{ marginTop: '2px', color: 'var(--muted)' }}>
                  {selectedReport.reporter?.email} · {selectedReport.reporter?.role}
                </div>
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#8898aa' }}>
                  Filed on {dateLabel(selectedReport.createdAt)}
                </div>
              </div>
            </div>

            {/* Evidence & Description */}
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Report Description & Evidence
              </span>
              <p style={{ background: 'white', border: '1px solid #eef2f7', borderRadius: '7px', padding: '12px 14px', fontSize: '13px', lineHeight: 1.6, marginTop: '6px', color: '#334155' }}>
                {selectedReport.description || 'No additional text description provided by reporter.'}
              </p>
            </div>

            {selectedReport.relatedProject && (
              <div style={{ marginBottom: '14px', fontSize: '12px', color: 'var(--muted)' }}>
                Related Project Brief: <strong>{selectedReport.relatedProject.title}</strong>
              </div>
            )}

            {selectedReport.relatedConversation && (
              <div style={{ marginBottom: '14px', fontSize: '12px', color: 'var(--muted)', background: '#edf4ff', padding: '8px 12px', borderRadius: '6px' }}>
                <MessageSquare size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
                Attached Conversation Thread (ID: #{selectedReport.relatedConversationId})
              </div>
            )}

            {saveSuccess && <div className="success-banner" style={{ marginBottom: '14px' }}><Check size={16} />{saveSuccess}</div>}
            {saveError && <div className="form-alert" style={{ marginBottom: '14px' }}>{saveError}</div>}

            {/* Admin Resolution Form */}
            <form onSubmit={handleUpdateReport} style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>
                  Moderation Decision / Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid var(--line)', fontSize: '13px' }}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="RESOLVED">RESOLVED (Action Taken)</option>
                  <option value="DISMISSED">DISMISSED (No Violation)</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>
                  Resolution Notes (Internal record & documentation)
                </label>
                <textarea
                  rows={3}
                  placeholder="Record investigation findings, actions taken against the reported party, or reasoning for dismissal..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid var(--line)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setSelectedReport(null)}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={saving}
                >
                  {saving ? 'Updating…' : 'Record Moderation Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
