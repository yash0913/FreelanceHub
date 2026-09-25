import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock,
  FileQuestion,
  Flag,
  FolderKanban,
  HelpCircle,
  LifeBuoy,
  MessageSquare,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Tag,
  UserRound,
  X
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const unwrap = (res) => res?.data?.data ?? res?.data ?? res

const dateLabel = (val) => {
  if (!val) return 'Date not specified'
  const d = new Date(val)
  return Number.isNaN(d.getTime())
    ? 'Date not specified'
    : d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

const categoryIcons = {
  Account: UserRound,
  Projects: FolderKanban,
  Payments: CircleDollarSign,
  Collaboration: Sparkles,
  Messaging: MessageSquare,
  'Reports & Safety': Flag
}

export default function SupportPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'faq'

  const [tab, setTab] = useState(initialTab)

  // FAQ State
  const [faqCategories, setFaqCategories] = useState([])
  const [loadingFaq, setLoadingFaq] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [expandedFaq, setExpandedFaq] = useState(null)

  // Tickets State
  const [tickets, setTickets] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [ticketError, setTicketError] = useState('')

  // Create Ticket State
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false)
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'ACCOUNT',
    priority: 'MEDIUM',
    description: '',
    relatedProjectId: ''
  })
  const [submittingTicket, setSubmittingTicket] = useState(false)
  const [createTicketError, setCreateTicketError] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  // Fetch FAQ Data
  const loadFaq = async () => {
    setLoadingFaq(true)
    try {
      const params = {}
      if (searchQuery.trim()) params.q = searchQuery.trim()
      if (selectedCategory) params.category = selectedCategory

      const res = await api.get('/help/faq', { params })
      setFaqCategories(unwrap(res) || [])
    } catch (err) {
      console.error('FAQ loading error:', err)
    } finally {
      setLoadingFaq(false)
    }
  }

  // Fetch Tickets
  const loadTickets = async () => {
    if (!user) return
    setLoadingTickets(true)
    setTicketError('')
    try {
      const res = await api.get('/support/tickets/mine')
      setTickets(unwrap(res) || [])
    } catch (err) {
      setTicketError(err?.response?.data?.message || 'Unable to load support tickets')
    } finally {
      setLoadingTickets(false)
    }
  }

  useEffect(() => {
    loadFaq()
  }, [selectedCategory])

  useEffect(() => {
    if (tab === 'tickets') loadTickets()
  }, [tab, user])

  // Handle Create Ticket Submit
  const handleTicketSubmit = async (e) => {
    e.preventDefault()
    setSubmittingTicket(true)
    setCreateTicketError('')
    try {
      await api.post('/support/tickets', {
        ...ticketForm,
        relatedProjectId: ticketForm.relatedProjectId ? Number(ticketForm.relatedProjectId) : undefined
      })
      setShowCreateTicketModal(false)
      setToastMessage('Support ticket filed successfully! Our team will review and reply shortly.')
      setTicketForm({
        subject: '',
        category: 'ACCOUNT',
        priority: 'MEDIUM',
        description: '',
        relatedProjectId: ''
      })
      setTab('tickets')
      loadTickets()
    } catch (err) {
      setCreateTicketError(err?.response?.data?.message || 'Failed to submit support ticket')
    } finally {
      setSubmittingTicket(false)
    }
  }

  return (
    <div className="support-help-page">
      <div className="page-intro" style={{ marginBottom: '22px' }}>
        <div>
          <div className="eyebrow">Customer Care & Knowledge Base</div>
          <h1>Help Center & Support</h1>
          <p>
            Find answers to common questions about accounts, projects, payments, collaborations, or file a ticket with Customer Care.
          </p>
        </div>
        {user && (
          <button
            className="button button-primary"
            onClick={() => setShowCreateTicketModal(true)}
            type="button"
          >
            <Plus size={16} /> Open support ticket
          </button>
        )}
      </div>

      {toastMessage && (
        <div className="success-banner" style={{ marginBottom: '18px' }}>
          <Check size={16} /> {toastMessage}
          <button
            onClick={() => setToastMessage('')}
            style={{ marginLeft: 'auto', background: 'none', border: 0 }}
            type="button"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="frw-filter-row" style={{ marginBottom: '22px' }}>
        <button
          type="button"
          className={`frw-filter ${tab === 'faq' ? 'active' : ''}`}
          onClick={() => setTab('faq')}
        >
          <HelpCircle size={15} /> Help & FAQ
        </button>
        {user && (
          <button
            type="button"
            className={`frw-filter ${tab === 'tickets' ? 'active' : ''}`}
            onClick={() => setTab('tickets')}
          >
            <LifeBuoy size={15} /> My Support Tickets ({tickets.length || '•'})
          </button>
        )}
      </div>

      {/* TAB 1: FAQ & KNOWLEDGE BASE */}
      {tab === 'faq' && (
        <div>
          {/* Search bar */}
          <div
            className="panel"
            style={{
              padding: '16px 20px',
              marginBottom: '22px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}
          >
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="Search questions, topics, or keywords (e.g. collaboration, payments, verify, contract)…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadFaq()}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  fontSize: '13px'
                }}
              />
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9aa6b7'
                }}
              />
            </div>
            <button
              className="button button-primary button-small"
              onClick={loadFaq}
              type="button"
            >
              Search
            </button>
          </div>

          {/* Category Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '22px' }}>
            <button
              type="button"
              className={`button button-small ${selectedCategory === '' ? 'button-primary' : 'button-outline'}`}
              onClick={() => setSelectedCategory('')}
            >
              All Categories
            </button>
            {['Account', 'Projects', 'Payments', 'Collaboration', 'Messaging', 'Reports & Safety'].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`button button-small ${selectedCategory === cat ? 'button-primary' : 'button-outline'}`}
                onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ Sections */}
          {loadingFaq ? (
            <div className="panel" style={{ padding: '40px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p className="muted">Loading knowledge base…</p>
            </div>
          ) : faqCategories.length === 0 ? (
            <div className="panel" style={{ padding: '48px', textAlign: 'center' }}>
              <FileQuestion size={40} style={{ color: '#9aa6b7', margin: '0 auto 12px' }} />
              <h3>No matching questions found</h3>
              <p className="muted" style={{ maxWidth: '440px', margin: '8px auto 16px' }}>
                Try searching for different keywords or submit a ticket directly to Customer Care.
              </p>
              {user && (
                <button
                  className="button button-primary"
                  onClick={() => setShowCreateTicketModal(true)}
                  type="button"
                >
                  Contact Support
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {faqCategories.map((category) => {
                const Icon = categoryIcons[category.category] || HelpCircle
                return (
                  <div key={category.category} className="panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          background: 'var(--blue-soft)',
                          color: 'var(--blue)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: '17px', margin: 0 }}>{category.title}</h2>
                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          {category.description}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: '10px' }}>
                      {category.faqs.map((faq) => {
                        const isExpanded = expandedFaq === faq.id
                        return (
                          <div
                            key={faq.id}
                            style={{
                              border: '1px solid #eef2f7',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              background: isExpanded ? '#fafcff' : 'white'
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                              style={{
                                width: '100%',
                                padding: '14px 18px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'transparent',
                                border: 0,
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: isExpanded ? 'var(--blue)' : 'var(--ink)'
                              }}
                            >
                              <span>{faq.question}</span>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {isExpanded && (
                              <div
                                style={{
                                  padding: '0 18px 16px',
                                  fontSize: '13px',
                                  color: '#55637d',
                                  lineHeight: 1.65,
                                  borderTop: '1px solid #f0f4f9',
                                  paddingTop: '12px'
                                }}
                              >
                                <p style={{ margin: '0 0 10px' }}>{faq.answer}</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                  {faq.tags.map((tag, idx) => (
                                    <span
                                      key={idx}
                                      style={{
                                        fontSize: '10px',
                                        background: '#edf2f9',
                                        color: '#65748e',
                                        padding: '2px 7px',
                                        borderRadius: '4px'
                                      }}
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY SUPPORT TICKETS */}
      {tab === 'tickets' && user && (
        <div>
          {loadingTickets ? (
            <div className="panel" style={{ padding: '40px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p className="muted">Loading support tickets…</p>
            </div>
          ) : ticketError ? (
            <div className="panel" style={{ padding: '24px', borderLeft: '4px solid #d93838' }}>
              <strong>Error:</strong> {ticketError}
            </div>
          ) : tickets.length === 0 ? (
            <div className="panel" style={{ padding: '48px', textAlign: 'center' }}>
              <LifeBuoy size={40} style={{ color: '#9aa6b7', margin: '0 auto 12px' }} />
              <h3>No support tickets yet</h3>
              <p className="muted" style={{ maxWidth: '420px', margin: '8px auto 16px' }}>
                Need help with payments, account settings, project contracts, or platform guidance? Open a ticket to reach administration.
              </p>
              <button
                className="button button-primary"
                onClick={() => setShowCreateTicketModal(true)}
                type="button"
              >
                Create a support ticket
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {tickets.map((t) => (
                <div key={t.id} className="panel" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className={`status status-${t.status?.toLowerCase()}`}>
                          {t.status}
                        </span>
                        <span className="status status-open">{t.category}</span>
                        <span style={{ fontSize: '11px', color: '#8898aa' }}>
                          Priority: <strong>{t.priority}</strong> · Filed {dateLabel(t.createdAt)}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '17px', margin: '4px 0 2px' }}>{t.subject}</h3>
                      {t.relatedProject && (
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                          Related Project: <strong>{t.relatedProject.title}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <p style={{ color: '#55637d', fontSize: '13px', margin: '12px 0', lineHeight: 1.6 }}>
                    {t.description}
                  </p>

                  {/* Admin Resolution / Notes */}
                  {t.adminNotes && (
                    <div
                      style={{
                        background: '#f4f8fd',
                        borderLeft: '3px solid var(--blue)',
                        padding: '12px 16px',
                        borderRadius: '0 8px 8px 0',
                        marginTop: '12px',
                        fontSize: '12px'
                      }}
                    >
                      <strong style={{ color: 'var(--blue)', display: 'block', marginBottom: '3px' }}>
                        Customer Care Resolution / Response:
                      </strong>
                      <p style={{ margin: 0, color: 'var(--ink)' }}>{t.adminNotes}</p>
                      {t.resolvedBy && (
                        <small style={{ color: '#8898aa', display: 'block', marginTop: '6px' }}>
                          Handled by {t.resolvedBy.name} {t.resolvedAt ? `· ${dateLabel(t.resolvedAt)}` : ''}
                        </small>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: SUBMIT SUPPORT TICKET */}
      {showCreateTicketModal && (
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
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0,0,0,.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <div className="eyebrow">Customer Care</div>
                <h2 style={{ fontSize: '20px', margin: '2px 0 0' }}>Submit Support Request</h2>
              </div>
              <button
                onClick={() => setShowCreateTicketModal(false)}
                style={{ background: 'none', border: 0, cursor: 'pointer' }}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            {createTicketError && <div className="form-alert" style={{ marginBottom: '16px' }}>{createTicketError}</div>}

            <form onSubmit={handleTicketSubmit} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>
                  Ticket Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Question regarding contract milestone settlement"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid var(--line)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>
                    Category
                  </label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid var(--line)', fontSize: '13px' }}
                  >
                    <option value="ACCOUNT">Account & Login</option>
                    <option value="PAYMENTS">Payments & Billing</option>
                    <option value="PROJECT">Projects & Proposals</option>
                    <option value="CONTRACT">Contract & Milestones</option>
                    <option value="TECHNICAL">Technical Issue</option>
                    <option value="OTHER">Other Inquiries</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>
                    Priority
                  </label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid var(--line)', fontSize: '13px' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>
                  Detailed Description *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain what happened, what assistance you need, and any relevant background..."
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid var(--line)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setShowCreateTicketModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={submittingTicket}
                >
                  {submittingTicket ? 'Submitting…' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
