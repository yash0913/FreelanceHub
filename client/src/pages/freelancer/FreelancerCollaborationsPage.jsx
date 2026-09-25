import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Tag,
  Users,
  X,
  XCircle
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const unwrap = (res) => res?.data?.data ?? res?.data ?? res

const formatMoney = (type, comp) => {
  if (type === 'UNPAID') return 'Unpaid / Experience'
  if (comp) return comp
  if (type === 'PAID') return 'Paid Stipend'
  return 'Negotiable'
}

const titleCase = (s) =>
  String(s || '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase())

const dateLabel = (val) => {
  if (!val) return 'Date not specified'
  const d = new Date(val)
  return Number.isNaN(d.getTime())
    ? 'Date not specified'
    : d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function FreelancerCollaborationsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Tabs: 'discover', 'mine', 'applications', 'verified'
  const [tab, setTab] = useState('discover')

  // Discover state
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [modeFilter, setModeFilter] = useState('')
  const [compFilter, setCompFilter] = useState('')

  // My created opportunities
  const [myOpps, setMyOpps] = useState([])
  const [loadingMyOpps, setLoadingMyOpps] = useState(false)

  // My applications
  const [myApps, setMyApps] = useState([])
  const [loadingMyApps, setLoadingMyApps] = useState(false)

  // Verified collaborations
  const [verifiedList, setVerifiedList] = useState([])
  const [loadingVerified, setLoadingVerified] = useState(false)

  // Create Opportunity Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '',
    roleNeeded: '',
    description: '',
    expectedContribution: '',
    type: 'PROJECT_COLLABORATION',
    compensationType: 'PAID',
    compensation: '',
    workMode: 'REMOTE',
    location: '',
    duration: '',
    maxCollaborators: 1,
    requirements: '',
    skills: ''
  })
  const [submittingCreate, setSubmittingCreate] = useState(false)
  const [createError, setCreateError] = useState('')

  // Apply Modal
  const [selectedOpp, setSelectedOpp] = useState(null)
  const [applyMessage, setApplyMessage] = useState('')
  const [submittingApply, setSubmittingApply] = useState(false)
  const [applySuccess, setApplySuccess] = useState('')
  const [applyError, setApplyError] = useState('')

  // Action status message
  const [toastMessage, setToastMessage] = useState('')

  // Load Discover Opportunities
  const loadDiscover = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (typeFilter) params.type = typeFilter
      if (modeFilter) params.workMode = modeFilter
      if (compFilter) params.compensationType = compFilter

      const res = await api.get('/collaborations', { params })
      setOpportunities(unwrap(res) || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Load My Created Opportunities
  const loadMyOpps = async () => {
    setLoadingMyOpps(true)
    try {
      const res = await api.get('/collaborations/mine/created')
      setMyOpps(unwrap(res) || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMyOpps(false)
    }
  }

  // Load My Applications
  const loadMyApps = async () => {
    setLoadingMyApps(true)
    try {
      const res = await api.get('/collaborations/mine/applications')
      setMyApps(unwrap(res) || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMyApps(false)
    }
  }

  // Load Verified Collaborations
  const loadVerified = async () => {
    setLoadingVerified(true)
    try {
      const res = await api.get('/collaborations/mine/verified')
      setVerifiedList(unwrap(res) || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingVerified(false)
    }
  }

  useEffect(() => {
    if (tab === 'discover') loadDiscover()
    else if (tab === 'mine') loadMyOpps()
    else if (tab === 'applications') loadMyApps()
    else if (tab === 'verified') loadVerified()
  }, [tab, typeFilter, modeFilter, compFilter])

  // Handle Create Opportunity
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setSubmittingCreate(true)
    setCreateError('')
    try {
      await api.post('/collaborations', createForm)
      setShowCreateModal(false)
      setToastMessage('Collaboration opportunity posted successfully!')
      setCreateForm({
        title: '',
        roleNeeded: '',
        description: '',
        expectedContribution: '',
        type: 'PROJECT_COLLABORATION',
        compensationType: 'PAID',
        compensation: '',
        workMode: 'REMOTE',
        location: '',
        duration: '',
        maxCollaborators: 1,
        requirements: '',
        skills: ''
      })
      if (tab === 'mine') loadMyOpps()
      else setTab('mine')
    } catch (err) {
      setCreateError(err?.response?.data?.message || 'Failed to post opportunity')
    } finally {
      setSubmittingCreate(false)
    }
  }

  // Handle Submit Application
  const handleApplySubmit = async (e) => {
    e.preventDefault()
    if (!selectedOpp) return
    setSubmittingApply(true)
    setApplyError('')
    setApplySuccess('')
    try {
      await api.post(`/collaborations/${selectedOpp.id}/apply`, {
        message: applyMessage
      })
      setApplySuccess('Application submitted! The opportunity creator has been notified.')
      setApplyMessage('')
      setTimeout(() => {
        setSelectedOpp(null)
        setApplySuccess('')
        loadDiscover()
      }, 1800)
    } catch (err) {
      setApplyError(err?.response?.data?.message || 'Failed to submit application')
    } finally {
      setSubmittingApply(false)
    }
  }

  // Accept or Reject Applicant
  const handleApplicationStatus = async (appId, newStatus) => {
    try {
      await api.patch(`/collaborations/applications/${appId}`, { status: newStatus })
      setToastMessage(`Application ${newStatus.toLowerCase()} successfully.`)
      loadMyOpps()
    } catch (err) {
      alert(err?.response?.data?.message || 'Action failed')
    }
  }

  // Complete Collaboration
  const handleCompleteCollab = async (oppId) => {
    if (!window.confirm('Mark this collaboration as completed? All accepted collaborators will receive a verified work history entry on their profiles.')) {
      return
    }
    try {
      const res = await api.post(`/collaborations/${oppId}/complete`)
      setToastMessage(res?.data?.message || 'Collaboration marked completed and verified history generated!')
      loadMyOpps()
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to complete collaboration')
    }
  }

  // Start a collaboration conversation (F↔F) — passes collaborationMode flag
  const handleStartMessage = async (participantId) => {
    try {
      const res = await api.post('/conversations', { participantId, collaborationMode: true })
      const conv = unwrap(res)
      navigate(`/freelancer/messages?conversation=${conv.id}`)
    } catch (err) {
      alert(err?.response?.data?.message || 'Unable to open conversation')
    }
  }

  return (
    <div className="freelancer-collaborations-page">
      <div className="page-intro" style={{ marginBottom: '22px' }}>
        <div>
          <div className="eyebrow">Peer Collaboration & Internships</div>
          <h1>Freelancer Collaboration Network</h1>
          <p>
            Partner with peers on real projects, mentor trainees, or join teams to earn verified platform experience.
          </p>
        </div>
        <button
          className="button button-primary"
          onClick={() => setShowCreateModal(true)}
          type="button"
        >
          <Plus size={16} /> Post collaboration
        </button>
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

      {/* Navigation tabs */}
      <div className="frw-filter-row" style={{ marginBottom: '20px' }}>
        {[
          ['discover', 'Discover Opportunities'],
          ['mine', `My Posted Opportunities (${myOpps.length || '•'})`],
          ['applications', `My Applications (${myApps.length || '•'})`],
          ['verified', `Verified Work History (${verifiedList.length || '•'})`]
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`frw-filter ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: DISCOVER OPPORTUNITIES */}
      {tab === 'discover' && (
        <div>
          {/* Search & Filter Bar */}
          <div
            className="panel"
            style={{
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center'
            }}
          >
            <div style={{ flex: '1 1 260px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by title, role, or keywords…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadDiscover()}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  fontSize: '13px'
                }}
              />
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '11px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9aa6b7'
                }}
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                fontSize: '12px'
              }}
            >
              <option value="">All Collaboration Types</option>
              <option value="INTERNSHIP">Internship / Trainee</option>
              <option value="PROJECT_COLLABORATION">Project Collaboration</option>
              <option value="FREELANCE_ASSISTANCE">Freelance Assistance</option>
              <option value="CO_FREELANCER">Co-Freelancer</option>
              <option value="MENTORSHIP">Mentorship</option>
            </select>

            <select
              value={compFilter}
              onChange={(e) => setCompFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                fontSize: '12px'
              }}
            >
              <option value="">All Compensation</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid (Learning/Internship)</option>
              <option value="NEGOTIABLE">Negotiable</option>
            </select>

            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                fontSize: '12px'
              }}
            >
              <option value="">All Work Modes</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ON_SITE">On-site</option>
            </select>

            <button
              className="button button-outline button-small"
              onClick={loadDiscover}
              type="button"
            >
              Filter
            </button>
          </div>

          {loading ? (
            <div className="panel" style={{ padding: '40px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p className="muted">Loading open collaborations…</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="panel" style={{ padding: '48px', textAlign: 'center' }}>
              <Users size={36} style={{ color: '#9aa6b7', margin: '0 auto 12px' }} />
              <h3>No collaboration opportunities found</h3>
              <p className="muted" style={{ maxWidth: '440px', margin: '8px auto 16px' }}>
                There are currently no open opportunities matching your filter. Be the first to create a collaboration request!
              </p>
              <button
                className="button button-primary"
                onClick={() => setShowCreateModal(true)}
                type="button"
              >
                Post an opportunity
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {opportunities.map((opp) => {
                const isOwner = opp.creatorId === user?.id
                return (
                  <article key={opp.id} className="panel" style={{ display: 'flex', flexDirection: 'column', padding: '22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span className={`status status-${opp.type?.toLowerCase().includes('intern') ? 'active' : 'customer'}`}>
                        {titleCase(opp.type)}
                      </span>
                      <span className="status status-open">{formatMoney(opp.compensationType, opp.compensation)}</span>
                    </div>

                    <h3 style={{ fontSize: '16px', margin: '0 0 6px' }}>{opp.title}</h3>
                    <div style={{ color: 'var(--blue)', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
                      Role needed: {opp.roleNeeded}
                    </div>

                    <p style={{ color: '#66738c', fontSize: '12px', lineHeight: 1.6, flex: 1, margin: '0 0 14px' }}>
                      {opp.description}
                    </p>

                    {opp.skills && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px' }}>
                        {opp.skills.split(',').map((s, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: '#f2f5fa',
                              color: '#55637d',
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}
                          >
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        borderTop: '1px solid var(--line)',
                        paddingTop: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11px',
                        color: '#8b98ad'
                      }}
                    >
                      <div>
                        <strong>{opp.creator?.name || 'Freelancer'}</strong>
                        <div style={{ marginTop: '2px' }}>
                          {titleCase(opp.workMode)} {opp.duration ? `· ${opp.duration}` : ''}
                        </div>
                      </div>

                      {isOwner ? (
                        <span style={{ color: 'var(--blue)', fontWeight: 600, fontSize: '11px' }}>
                          Your opportunity
                        </span>
                      ) : (
                        <button
                          className="button button-primary button-small"
                          onClick={() => setSelectedOpp(opp)}
                          type="button"
                        >
                          View & Apply
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY POSTED OPPORTUNITIES */}
      {tab === 'mine' && (
        <div>
          {loadingMyOpps ? (
            <div className="panel" style={{ padding: '40px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p className="muted">Loading your posted opportunities…</p>
            </div>
          ) : myOpps.length === 0 ? (
            <div className="panel" style={{ padding: '48px', textAlign: 'center' }}>
              <BriefcaseBusiness size={36} style={{ color: '#9aa6b7', margin: '0 auto 12px' }} />
              <h3>You haven't posted any collaborations yet</h3>
              <p className="muted" style={{ margin: '8px auto 16px', maxWidth: '420px' }}>
                Create an opportunity to bring interns, assistants, or specialized peers onto your projects.
              </p>
              <button
                className="button button-primary"
                onClick={() => setShowCreateModal(true)}
                type="button"
              >
                Post an opportunity
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '18px' }}>
              {myOpps.map((opp) => {
                const apps = opp.applications || []
                const acceptedApps = apps.filter((a) => a.status === 'ACCEPTED')
                const isCompleted = opp.status === 'COMPLETED'

                return (
                  <article key={opp.id} className="panel" style={{ padding: '22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                          <span className={`status status-${opp.status?.toLowerCase()}`}>
                            {opp.status}
                          </span>
                          <span className="status status-open">{titleCase(opp.type)}</span>
                          <span style={{ fontSize: '11px', color: '#8898aa' }}>
                            Created {dateLabel(opp.createdAt)}
                          </span>
                        </div>
                        <h2 style={{ fontSize: '18px', margin: '0 0 4px' }}>{opp.title}</h2>
                        <div style={{ color: 'var(--blue)', fontSize: '13px', fontWeight: 600 }}>
                          Role: {opp.roleNeeded} · {formatMoney(opp.compensationType, opp.compensation)} · {titleCase(opp.workMode)}
                        </div>
                      </div>

                      {!isCompleted && opp.status !== 'CANCELLED' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {acceptedApps.length > 0 && (
                            <button
                              className="button button-primary button-small"
                              onClick={() => handleCompleteCollab(opp.id)}
                              type="button"
                              style={{ background: 'var(--green)' }}
                            >
                              <Award size={14} /> Mark Completed & Verify Experience
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <p style={{ color: '#55637d', fontSize: '13px', margin: '14px 0', lineHeight: 1.6 }}>
                      {opp.description}
                    </p>

                    {/* Applications List */}
                    <div style={{ borderTop: '1px solid var(--line)', marginTop: '16px', paddingTop: '16px' }}>
                      <strong style={{ fontSize: '13px', display: 'block', marginBottom: '10px' }}>
                        Applicants ({apps.length})
                      </strong>

                      {apps.length === 0 ? (
                        <p className="muted" style={{ fontSize: '12px' }}>
                          No applications submitted yet for this role.
                        </p>
                      ) : (
                        <div style={{ display: 'grid', gap: '10px' }}>
                          {apps.map((app) => (
                            <div
                              key={app.id}
                              style={{
                                background: '#f9fbfe',
                                border: '1px solid #e5edf8',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '12px'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <strong>{app.applicant?.name}</strong>
                                  <span className={`status status-${app.status?.toLowerCase()}`}>
                                    {app.status}
                                  </span>
                                </div>
                                <div style={{ color: 'var(--muted)', fontSize: '11px', marginTop: '2px' }}>
                                  {app.applicant?.professionalTitle || 'Independent Freelancer'} · Applied {dateLabel(app.createdAt)}
                                </div>
                                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#445169' }}>
                                  “{app.message}”
                                </p>
                              </div>

                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button
                                  className="button button-outline button-small"
                                  onClick={() => handleStartMessage(app.applicant.id)}
                                  type="button"
                                >
                                  <MessageSquare size={14} /> Message
                                </button>

                                {app.status === 'PENDING' && !isCompleted && (
                                  <>
                                    <button
                                      className="button button-primary button-small"
                                      onClick={() => handleApplicationStatus(app.id, 'ACCEPTED')}
                                      type="button"
                                      style={{ background: 'var(--green)' }}
                                    >
                                      <Check size={14} /> Accept
                                    </button>
                                    <button
                                      className="button button-ghost button-small"
                                      onClick={() => handleApplicationStatus(app.id, 'REJECTED')}
                                      type="button"
                                      style={{ color: '#d93838' }}
                                    >
                                      <X size={14} /> Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MY APPLICATIONS */}
      {tab === 'applications' && (
        <div>
          {loadingMyApps ? (
            <div className="panel" style={{ padding: '40px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p className="muted">Loading your submitted applications…</p>
            </div>
          ) : myApps.length === 0 ? (
            <div className="panel" style={{ padding: '48px', textAlign: 'center' }}>
              <Users size={36} style={{ color: '#9aa6b7', margin: '0 auto 12px' }} />
              <h3>No collaboration applications yet</h3>
              <p className="muted" style={{ margin: '8px auto 16px', maxWidth: '420px' }}>
                Explore open opportunities to gain hands-on experience and build verified platform work history.
              </p>
              <button
                className="button button-primary"
                onClick={() => setTab('discover')}
                type="button"
              >
                Browse opportunities
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {myApps.map((app) => (
                <div key={app.id} className="panel" style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                        <span className={`status status-${app.status?.toLowerCase()}`}>
                          {app.status}
                        </span>
                        <span style={{ fontSize: '11px', color: '#8898aa' }}>
                          Submitted {dateLabel(app.createdAt)}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '16px', margin: '0 0 4px' }}>{app.opportunity?.title}</h3>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        Created by <strong>{app.opportunity?.creator?.name}</strong> · {titleCase(app.opportunity?.type)} · {formatMoney(app.opportunity?.compensationType, app.opportunity?.compensation)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="button button-outline button-small"
                        onClick={() => handleStartMessage(app.opportunity.creatorId)}
                        type="button"
                      >
                        <MessageSquare size={14} /> Message Owner
                      </button>
                      {app.status === 'PENDING' && (
                        <button
                          className="button button-ghost button-small"
                          onClick={() => handleApplicationStatus(app.id, 'WITHDRAWN')}
                          type="button"
                          style={{ color: '#d93838' }}
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', marginTop: '12px', fontSize: '12px', color: '#55637d' }}>
                    <strong>Your note:</strong> “{app.message}”
                  </div>

                  {app.status === 'ACCEPTED' && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#17825b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} /> Accepted collaborator! Upon completion, your verified experience will be recorded.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VERIFIED WORK HISTORY */}
      {tab === 'verified' && (
        <div>
          <div className="inline-callout" style={{ marginBottom: '18px' }}>
            <Sparkles size={16} />
            <span>
              <strong>Verified Platform Collaborations:</strong> These entries are certified by platform database records from completed collaborations. Unlike self-added portfolio items, they represent verified peer-reviewed engagements.
            </span>
          </div>

          {loadingVerified ? (
            <div className="panel" style={{ padding: '40px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p className="muted">Loading verified collaboration records…</p>
            </div>
          ) : verifiedList.length === 0 ? (
            <div className="panel" style={{ padding: '48px', textAlign: 'center' }}>
              <Award size={36} style={{ color: '#9aa6b7', margin: '0 auto 12px' }} />
              <h3>No verified collaborations yet</h3>
              <p className="muted" style={{ margin: '8px auto 16px', maxWidth: '440px' }}>
                Join an open collaboration opportunity and complete the engagement. Once marked completed by the lead freelancer, your verified record will appear here and on your public profile!
              </p>
              <button
                className="button button-primary"
                onClick={() => setTab('discover')}
                type="button"
              >
                Find open collaborations
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {verifiedList.map((item) => (
                <div key={item.id} className="panel" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span
                          style={{
                            background: '#e7f8f0',
                            color: '#17825b',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <CheckCircle2 size={13} /> Verified Collaboration
                        </span>
                        <span style={{ fontSize: '11px', color: '#8898aa' }}>
                          Completed {dateLabel(item.completedAt)}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '17px', margin: '2px 0 4px' }}>{item.projectTitle}</h3>
                      <div style={{ color: 'var(--blue)', fontSize: '13px', fontWeight: 600 }}>
                        Role: {item.role} · Partner: {item.collaborator?.name}
                      </div>
                    </div>

                    <span className="status status-open">
                      {formatMoney(item.compensationType, item.compensation)}
                    </span>
                  </div>

                  <p style={{ color: '#55637d', fontSize: '12px', margin: '12px 0', lineHeight: 1.6 }}>
                    {item.description}
                  </p>

                  {item.skills && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {item.skills.split(',').map((s, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: '#f2f5fa',
                            color: '#55637d',
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: POST COLLABORATION OPPORTUNITY */}
      {showCreateModal && (
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
                <div className="eyebrow">New Opportunity</div>
                <h2 style={{ fontSize: '20px', margin: '2px 0 0' }}>Post Collaboration Request</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 0, cursor: 'pointer' }}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            {createError && <div className="form-alert" style={{ marginBottom: '16px' }}>{createError}</div>}

            <form onSubmit={handleCreateSubmit} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>
                  Collaboration Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. E-Commerce Redesign Component Collaborator"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid var(--line)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>
                    Role Needed *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Junior React Developer"
                    value={createForm.roleNeeded}
                    onChange={(e) => setCreateForm({ ...createForm, roleNeeded: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid var(--line)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>
                    Collaboration Type
                  </label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid var(--line)', fontSize: '13px' }}
                  >
                    <option value="PROJECT_COLLABORATION">Project Collaboration</option>
                    <option value="INTERNSHIP">Internship / Trainee</option>
                    <option value="FREELANCE_ASSISTANCE">Freelance Assistance</option>
                    <option value="CO_FREELANCER">Co-Freelancer</option>
                    <option value="MENTORSHIP">Mentorship</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>
                  Project & Scope Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the project, scope, and objectives of the collaboration..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid var(--line)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>
                    Compensation Model
                  </label>
                  <select
                    value={createForm.compensationType}
                    onChange={(e) => setCreateForm({ ...createForm, compensationType: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid var(--line)', fontSize: '13px' }}
                  >
                    <option value="PAID">Paid Stipend / Project Fee</option>
                    <option value="UNPAID">Unpaid (Learning & Verified Portfolio)</option>
                    <option value="NEGOTIABLE">Negotiable Arrangement</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>
                    Compensation Details (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹8,000 or Profit Share"
                    value={createForm.compensation}
                    onChange={(e) => setCreateForm({ ...createForm, compensation: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid var(--line)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>
                    Work Mode
                  </label>
                  <select
                    value={createForm.workMode}
                    onChange={(e) => setCreateForm({ ...createForm, workMode: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid var(--line)', fontSize: '13px' }}
                  >
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ON_SITE">On-Site</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>
                    Duration
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3 weeks, 1 month"
                    value={createForm.duration}
                    onChange={(e) => setCreateForm({ ...createForm, duration: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid var(--line)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>
                    Max Collaborators
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={createForm.maxCollaborators}
                    onChange={(e) => setCreateForm({ ...createForm, maxCollaborators: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid var(--line)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>
                  Required Skills (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, Tailwind CSS, REST APIs"
                  value={createForm.skills}
                  onChange={(e) => setCreateForm({ ...createForm, skills: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid var(--line)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={submittingCreate}
                >
                  {submittingCreate ? 'Posting…' : 'Publish Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APPLY TO COLLABORATION */}
      {selectedOpp && (
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
              maxWidth: '540px',
              width: '100%',
              padding: '26px',
              boxShadow: '0 20px 50px rgba(0,0,0,.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div className="eyebrow">{titleCase(selectedOpp.type)}</div>
                <h2 style={{ fontSize: '18px', margin: '2px 0 0' }}>{selectedOpp.title}</h2>
              </div>
              <button
                onClick={() => setSelectedOpp(null)}
                style={{ background: 'none', border: 0, cursor: 'pointer' }}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px' }}>
              <div style={{ color: 'var(--blue)', fontWeight: 600 }}>Role: {selectedOpp.roleNeeded}</div>
              <div style={{ color: '#55637d', marginTop: '4px' }}>
                Compensation: {formatMoney(selectedOpp.compensationType, selectedOpp.compensation)} · {titleCase(selectedOpp.workMode)} {selectedOpp.duration ? `· ${selectedOpp.duration}` : ''}
              </div>
              <p style={{ margin: '8px 0 0', color: '#687790', lineHeight: 1.5 }}>
                {selectedOpp.description}
              </p>
            </div>

            {applySuccess && <div className="success-banner" style={{ marginBottom: '14px' }}><Check size={16} />{applySuccess}</div>}
            {applyError && <div className="form-alert" style={{ marginBottom: '14px' }}>{applyError}</div>}

            {!applySuccess && (
              <form onSubmit={handleApplySubmit}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Why do you want to collaborate? (Application note) *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Introduce yourself, share your relevant skills, and state what you hope to achieve through this collaboration..."
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '7px', border: '1px solid var(--line)', fontSize: '13px', marginBottom: '16px' }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => setSelectedOpp(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={submittingApply || !applyMessage.trim()}
                  >
                    {submittingApply ? 'Submitting…' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
