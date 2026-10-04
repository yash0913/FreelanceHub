import React, { useState, useEffect } from 'react'
import {
  CheckCircle2, Clock, AlertTriangle, Calendar, ChevronDown, ChevronUp,
  Pencil, Save, X, Sparkles, Check, ArrowRight, UserCheck, ShieldAlert
} from 'lucide-react'
import api from '../../services/api'
import Button from '../ui/Button'

const STAGES = [
  { key: 'REQUIREMENTS', label: 'Requirements / Planning', short: 'Requirements' },
  { key: 'DEVELOPMENT', label: 'Development / WIP', short: 'Development' },
  { key: 'CLIENT_REVIEW', label: 'Client Feedback / Review', short: 'Review' },
  { key: 'REVISIONS', label: 'Revisions', short: 'Revisions' },
  { key: 'FINAL_DELIVERY', label: 'Final Delivery', short: 'Delivery' },
  { key: 'COMPLETED', label: 'Completed', short: 'Completed' }
]

const STATUS_CONFIG = {
  NOT_STARTED: { label: 'Not Started', color: '#6b7894', bg: '#f1f4f9' },
  IN_PROGRESS: { label: 'In Progress', color: '#2d6cdf', bg: '#eaf1ff' },
  CLIENT_REVIEW: { label: 'Under Client Review', color: '#7256c7', bg: '#f3efff' },
  WAITING_FOR_CLIENT: { label: 'Action Required', color: '#d97706', bg: '#fef3c7' },
  BLOCKED: { label: 'Blocked / On Hold', color: '#dc2626', bg: '#fee2e2' },
  COMPLETED: { label: 'Completed', color: '#16a34a', bg: '#dcfce7' }
}

export default function ProjectProgressTracker({ projectId, user, onUpdateDone }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')

  // Form state for updating progress
  const [stage, setStage] = useState('DEVELOPMENT')
  const [progressPercentage, setProgressPercentage] = useState(50)
  const [status, setStatus] = useState('IN_PROGRESS')
  const [note, setNote] = useState('')
  const [actionRequired, setActionRequired] = useState(false)
  const [actionNote, setActionNote] = useState('')
  const [expectedCompletion, setExpectedCompletion] = useState('')

  const loadProgress = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/projects/${projectId}/progress`)
      const payload = res.data?.data || res.data || {}
      setData(payload)
      if (payload.currentProgress) {
        setStage(payload.currentProgress.stage || 'DEVELOPMENT')
        setProgressPercentage(payload.currentProgress.progressPercentage ?? 0)
        setStatus(payload.currentProgress.status || 'IN_PROGRESS')
        setActionRequired(Boolean(payload.currentProgress.actionRequired))
        setActionNote(payload.currentProgress.actionNote || '')
        if (payload.currentProgress.expectedCompletion) {
          setExpectedCompletion(new Date(payload.currentProgress.expectedCompletion).toISOString().split('T')[0])
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load project progress tracking.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) loadProgress()
  }, [projectId])

  const handleSaveProgress = async (e) => {
    e.preventDefault()
    setSaving(true)
    setModalError('')
    try {
      await api.post(`/projects/${projectId}/progress`, {
        stage,
        progressPercentage: Number(progressPercentage),
        status,
        note,
        actionRequired,
        actionNote: actionRequired ? actionNote : '',
        expectedCompletion: expectedCompletion || null
      })
      setShowUpdateModal(false)
      setNote('')
      loadProgress()
      if (onUpdateDone) onUpdateDone('Project progress successfully recorded.')
    } catch (err) {
      setModalError(err?.response?.data?.message || 'Failed to save progress update. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="panel" style={{ padding: '24px', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 8px' }} />
        <span className="muted" style={{ fontSize: '13px' }}>Loading project progress…</span>
      </div>
    )
  }

  if (error || !data) {
    return null // Gracefully omit if project has no contract or progress not accessible
  }

  const { project, contract, currentProgress, isOverdue, history = [] } = data
  const isFreelancer = user?.role === 'FREELANCER' && contract?.freelancerId === user?.id
  const currentStageIndex = STAGES.findIndex(s => s.key === currentProgress.stage)
  const activeIndex = currentStageIndex >= 0 ? currentStageIndex : 0
  const statusCfg = STATUS_CONFIG[currentProgress.status] || STATUS_CONFIG['IN_PROGRESS']

  const dateLabel = (val) => val ? new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <div className="panel" style={{ marginBottom: '24px', border: '1px solid #dbeafe', background: 'linear-gradient(180deg, #f9fbff 0%, #ffffff 100%)' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--blue)' }}>
              Live Project Progress
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: statusCfg.color,
                background: statusCfg.bg,
                padding: '3px 9px',
                borderRadius: '12px'
              }}
            >
              {statusCfg.label}
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
            {project?.title || 'Active Project Progress'}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--blue)', lineHeight: 1 }}>
              {currentProgress.progressPercentage}%
            </div>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Completed</span>
          </div>

          {isFreelancer && (
            <Button
              className="button-small"
              onClick={() => setShowUpdateModal(true)}
              style={{ marginLeft: '8px' }}
            >
              <Pencil size={14} /> Update Progress
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ background: '#e2e8f0', borderRadius: '8px', height: '10px', overflow: 'hidden', marginBottom: '24px' }}>
        <div
          style={{
            background: currentProgress.progressPercentage === 100
              ? 'linear-gradient(90deg, #10b981, #059669)'
              : 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
            height: '100%',
            width: `${Math.min(100, Math.max(0, currentProgress.progressPercentage))}%`,
            transition: 'width 0.5s ease-in-out',
            borderRadius: '8px'
          }}
        />
      </div>

      {/* Stage Stepper Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '20px' }}>
        {STAGES.map((s, idx) => {
          const isPassed = idx < activeIndex || currentProgress.progressPercentage === 100
          const isCurrent = idx === activeIndex && currentProgress.progressPercentage < 100
          return (
            <div
              key={s.key}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: isCurrent ? 'var(--blue-soft)' : isPassed ? '#f0fdf4' : 'white',
                border: isCurrent
                  ? '2px solid var(--blue)'
                  : isPassed
                    ? '1px solid #bbf7d0'
                    : '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: isCurrent ? 'var(--blue)' : isPassed ? '#16a34a' : '#e2e8f0',
                  color: isCurrent || isPassed ? 'white' : '#64748b',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {isPassed ? <Check size={12} strokeWidth={3} /> : idx + 1}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: isCurrent ? 800 : 600,
                    color: isCurrent ? 'var(--blue-dark)' : isPassed ? '#15803d' : '#64748b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={s.label}
                >
                  {s.short}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>
                  {isCurrent ? 'Current stage' : isPassed ? 'Done' : 'Upcoming'}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action Required Alert Banner */}
      {currentProgress.actionRequired && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderLeft: '4px solid #f59e0b',
            borderRadius: '8px',
            padding: '14px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <AlertTriangle size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#92400e', fontSize: '14px', display: 'block', marginBottom: '2px' }}>
              Action Required from Client
            </strong>
            <p style={{ margin: 0, fontSize: '13px', color: '#b45309' }}>
              {currentProgress.actionNote || 'The freelancer is awaiting your feedback or confirmation to proceed.'}
            </p>
          </div>
        </div>
      )}

      {/* Overdue Alert Banner */}
      {isOverdue && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderLeft: '4px solid #ef4444',
            borderRadius: '8px',
            padding: '14px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <Clock size={20} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#991b1b', fontSize: '14px', display: 'block', marginBottom: '2px' }}>
              ⚠ Project is Overdue
            </strong>
            <p style={{ margin: 0, fontSize: '13px', color: '#b91c1c' }}>
              The expected completion date ({dateLabel(currentProgress.expectedCompletion)}) has passed. Please contact the freelancer or review the progress timeline.
            </p>
          </div>
        </div>
      )}

      {/* Key Dates & Meta Info */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          padding: '12px 16px',
          background: 'white',
          borderRadius: '8px',
          border: '1px solid var(--line)',
          marginBottom: '16px'
        }}
      >
        <div>
          <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Current Stage</span>
          <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>{currentProgress.stageLabel}</strong>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Expected Completion</span>
          <strong style={{ fontSize: '13px', color: isOverdue ? '#dc2626' : 'var(--ink)' }}>
            {dateLabel(currentProgress.expectedCompletion)}
          </strong>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Last Updated</span>
          <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>
            {dateLabel(currentProgress.updatedAt)}
          </strong>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Contractor / Talent</span>
          <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>
            {contract?.freelancer?.name || 'Assigned Freelancer'}
          </strong>
        </div>
      </div>

      {/* Latest Note */}
      {currentProgress.note && (
        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
            Latest Progress Note
          </span>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--ink)', lineHeight: 1.5 }}>
            "{currentProgress.note}"
          </p>
        </div>
      )}

      {/* Collapsible History Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          style={{
            background: 'transparent',
            border: 0,
            color: 'var(--blue)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: 0
          }}
        >
          {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showHistory ? 'Hide Progress History' : `View Progress History (${history.length} update${history.length === 1 ? '' : 's'})`}
        </button>

        {showHistory && (
          <div style={{ marginTop: '14px', borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
            {history.length === 0 ? (
              <p className="muted" style={{ fontSize: '13px' }}>No updates recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {history.map((h, i) => (
                  <div
                    key={h.id || i}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'white',
                      border: '1px solid var(--line)'
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--blue-soft)',
                        color: 'var(--blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '11px',
                        flexShrink: 0
                      }}
                    >
                      {h.progressPercentage}%
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <strong style={{ fontSize: '13px' }}>{h.stageLabel}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          {dateLabel(h.createdAt)} by {h.updatedBy?.name || 'Freelancer'}
                        </span>
                      </div>
                      {h.note && (
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                          {h.note}
                        </p>
                      )}
                      {h.actionRequired && (
                        <div style={{ marginTop: '6px', fontSize: '11px', color: '#b45309', fontWeight: 600 }}>
                          ⚠ Client Action Requested: {h.actionNote}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Freelancer Update Progress Modal */}
      {showUpdateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(20, 33, 61, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            className="panel form-panel"
            style={{
              width: '540px',
              maxWidth: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'white',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              borderRadius: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
              <div>
                <span className="panel-eyebrow">Milestone Tracking</span>
                <h3 style={{ margin: 0, fontSize: '18px' }}>Update Project Progress</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveProgress}>
              <div className="field">
                <label>Current Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '14px' }}
                  required
                >
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ margin: 0 }}>Progress Percentage</label>
                  <strong style={{ color: 'var(--blue)' }}>{progressPercentage}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressPercentage}
                  onChange={(e) => setProgressPercentage(e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--blue)' }}
                />
              </div>

              <div className="field">
                <label>Progress Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '14px' }}
                >
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="CLIENT_REVIEW">Ready for Client Review</option>
                  <option value="WAITING_FOR_CLIENT">Awaiting Client Feedback</option>
                  <option value="BLOCKED">Blocked / Waiting on Resources</option>
                  <option value="COMPLETED">Completed / Deliverable Handed Off</option>
                </select>
              </div>

              <div className="field">
                <label>Progress Update / Note</label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Completed initial design mockups, now starting responsive CSS and backend routes."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px' }}
                  required
                />
              </div>

              <div className="field">
                <label>Target / Expected Completion Date</label>
                <input
                  type="date"
                  value={expectedCompletion}
                  onChange={(e) => setExpectedCompletion(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px' }}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={actionRequired}
                    onChange={(e) => setActionRequired(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#d97706' }}
                  />
                  <span>Client Action Required (Notify Client with Alert)</span>
                </label>

                {actionRequired && (
                  <div style={{ marginTop: '10px' }}>
                    <input
                      type="text"
                      placeholder="e.g. Please review the prototype link and share your approval."
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fde68a', background: '#fffbeb', fontSize: '13px' }}
                      required={actionRequired}
                    />
                  </div>
                )}
              </div>

              <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUpdateModal(false)}
                >
                  Cancel
                </Button>
                <Button disabled={saving} aria-busy={saving}>
                  {saving ? 'Saving…' : 'Save Progress Update'} <Save size={15} />
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
