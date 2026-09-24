import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleDollarSign,
  FileText,
  FolderKanban,
  Search,
  ShieldCheck,
  Sparkles,
  Star
} from 'lucide-react'
import api from '../../services/api'
import './freelancer-dashboard.css'

const requests = {
  profile: { url: '/profile' },
  contracts: { url: '/contracts/mine' },
  proposals: { url: '/proposals/mine' },
  payments: { url: '/payments/mine' },
  reviews: { url: '/reviews/mine' },
  projects: { url: '/projects', params: { status: 'OPEN', limit: 4, sort: 'newest' } }
}

const initialResources = () => Object.fromEntries(
  Object.keys(requests).map((key) => [key, { data: null, loading: true, error: '' }])
)

const unwrap = (response) => response?.data?.data ?? response?.data ?? response
const friendlyError = (error) => {
  const status = error?.response?.status
  if (status === 401) return 'Your session could not be verified. Please sign in again.'
  if (status === 403) return 'You do not have permission to view this information.'
  if (status === 404) return 'This information is no longer available.'
  if (status >= 500) return 'We could not load this information right now. Please try again.'
  if (!error?.response) return 'We could not connect. Check your connection and try again.'
  return 'We could not load this information. Please try again.'
}
const positiveId = (value) => {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}
const asList = (value) => Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : []
const money = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  const amount = Number(value)
  return Number.isFinite(amount) ? `₹${amount.toLocaleString('en-IN')}` : '—'
}
const dateValue = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
const dateLabel = (value) => {
  const date = dateValue(value)
  return date ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date unavailable'
}
const titleCase = (value) => String(value || '').replaceAll('_', ' ').toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase())
const sortedByDate = (items, field = 'updatedAt') => [...items].sort((a, b) => {
  const first = dateValue(a?.[field])?.getTime() || 0
  const second = dateValue(b?.[field])?.getTime() || 0
  return second - first
})

function ResourceState({ loading, error, empty, retry }) {
  if (loading) return <div className="fd-state" role="status">Loading live records…</div>
  if (error) return <div className="fd-state fd-state-error"><span>{error}</span><button type="button" onClick={retry}>Try again</button></div>
  if (empty) return <div className="fd-state">{empty}</div>
  return null
}

function Panel({ eyebrow, title, action, className = '', children }) {
  return (
    <section className={`panel fd-panel ${className}`}>
      <div className="fd-panel-heading">
        <div>
          <span className="panel-eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Metric({ icon: Icon, label, value, detail, to, tone = 'blue' }) {
  const content = (
    <>
      <span className={`fd-metric-icon fd-tone-${tone}`}><Icon size={18} /></span>
      <span className="fd-metric-copy">
        <span className="fd-metric-label">{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </span>
      {to && <ArrowRight className="fd-metric-arrow" size={15} />}
    </>
  )
  return to
    ? <Link className="fd-metric" to={to}>{content}</Link>
    : <div className="fd-metric">{content}</div>
}

function ContractRow({ contract }) {
  const projectId = positiveId(contract?.project?.id ?? contract?.projectId)
  const content = (
    <>
      <span className="fd-row-icon"><FolderKanban size={17} /></span>
      <span className="fd-row-main">
        <strong>{contract?.project?.title || 'Project title unavailable'}</strong>
        <small>{contract?.client?.name || 'Customer'} · {money(contract?.agreedAmount)}</small>
      </span>
      <span className="fd-row-state"><span className={`status status-${String(contract?.status || '').toLowerCase()}`}>{titleCase(contract?.status)}</span></span>
      <span className="fd-row-action">View project <ArrowRight size={14} /></span>
    </>
  )
  return projectId
    ? <Link className="fd-contract-row" to={`/freelancer/projects/${projectId}`}>{content}</Link>
    : <div className="fd-contract-row fd-row-disabled">{content}</div>
}

function DeadlineRow({ deadline }) {
  const projectId = positiveId(deadline.projectId)
  const date = dateValue(deadline.date)
  const days = date ? Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000)) : null
  const timeText = days === null ? 'Date unavailable' : days === 0 ? 'Due today' : days === 1 ? '1 day left' : `${days} days left`
  const content = (
    <>
      <span className="fd-deadline-icon"><CalendarDays size={16} /></span>
      <span className="fd-row-main">
        <strong>{deadline.title}</strong>
        <small>{deadline.customer} · {dateLabel(deadline.date)}</small>
      </span>
      <span className="fd-deadline-time">{timeText}</span>
    </>
  )
  return projectId
    ? <Link className="fd-deadline-row" to={`/freelancer/projects/${projectId}`}>{content}</Link>
    : <div className="fd-deadline-row fd-row-disabled">{content}</div>
}

function ProposalItem({ proposal }) {
  const projectId = positiveId(proposal?.project?.id ?? proposal?.projectId)
  const content = (
    <>
      <span className="fd-row-icon"><FileText size={16} /></span>
      <span className="fd-row-main">
        <strong>{proposal?.project?.title || 'Project title unavailable'}</strong>
        <small>{money(proposal?.proposedPrice)} · Submitted {dateLabel(proposal?.createdAt)}</small>
      </span>
      <span className={`status status-${String(proposal?.status || '').toLowerCase()}`}>{titleCase(proposal?.status)}</span>
    </>
  )
  return projectId
    ? <Link className="fd-record-row" to={`/freelancer/projects/${projectId}`}>{content}</Link>
    : <div className="fd-record-row fd-row-disabled">{content}</div>
}

function PaymentItem({ payment }) {
  const projectTitle = payment?.contract?.project?.title || 'Contract payment'
  return (
    <Link className="fd-record-row" to="/freelancer/payments">
      <span className="fd-row-icon fd-row-icon-green"><CircleDollarSign size={16} /></span>
      <span className="fd-row-main"><strong>{projectTitle}</strong><small>{dateLabel(payment?.createdAt)}</small></span>
      <span className="fd-payment-amount">{money(payment?.amount)}</span>
      <span className={`status status-${String(payment?.status || '').toLowerCase()}`}>{titleCase(payment?.status)}</span>
    </Link>
  )
}

function Opportunity({ project }) {
  const projectId = positiveId(project?.id)
  const content = (
    <>
      <span className="fd-opportunity-top"><span>{project?.category?.name || 'Open project'}</span><span>{dateLabel(project?.createdAt)}</span></span>
      <strong>{project?.title || 'Project title unavailable'}</strong>
      <span className="fd-opportunity-customer">{project?.client?.name || 'Customer'} · {money(project?.budget)}</span>
      <span className="fd-opportunity-skills">{(project?.requiredSkills || []).slice(0, 4).map(({ skill }) => skill?.name).filter(Boolean).join(' · ') || 'No required skills listed'}</span>
      <span className="fd-opportunity-footer"><span>{Number.isFinite(Number(project?._count?.proposals)) ? `${Number(project._count.proposals)} proposals` : 'Proposal count unavailable'}</span><span className="fd-opportunity-link">View project <ArrowRight size={14} /></span></span>
    </>
  )
  return projectId
    ? <Link className="fd-opportunity" to={`/freelancer/projects/${projectId}`}>{content}</Link>
    : <div className="fd-opportunity fd-row-disabled">{content}</div>
}

function ActivityItem({ item }) {
  const Icon = item.icon
  return (
    <Link className="fd-activity-row" to={item.to}>
      <span className={`fd-row-icon ${item.tone === 'green' ? 'fd-row-icon-green' : ''}`}><Icon size={16} /></span>
      <span className="fd-row-main"><strong>{item.title}</strong><small>{item.description}</small></span>
      <span className="fd-activity-date">{dateLabel(item.date)}</span>
    </Link>
  )
}

export default function FreelancerDashboard({ user }) {
  const [resources, setResources] = useState(initialResources)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setResources((current) => Object.fromEntries(Object.entries(current).map(([key, value]) => [key, { ...value, loading: true, error: '' }])))
    const entries = Object.entries(requests)
    Promise.allSettled(entries.map(([, request]) => api.get(request.url, { params: request.params })))
      .then((results) => {
        if (!active) return
        setResources(Object.fromEntries(results.map((result, index) => {
          const key = entries[index][0]
          return [key, result.status === 'fulfilled'
            ? { data: unwrap(result.value), loading: false, error: '' }
            : { data: null, loading: false, error: friendlyError(result.reason) }]
        })))
      })
    return () => { active = false }
  }, [reloadKey])

  const retry = () => setReloadKey((key) => key + 1)
  const profileState = resources.profile
  const contractsState = resources.contracts
  const proposalsState = resources.proposals
  const paymentsState = resources.payments
  const projectsState = resources.projects
  const reviewsState = resources.reviews

  const profile = profileState.data
  const contracts = useMemo(() => asList(contractsState.data), [contractsState.data])
  const proposals = useMemo(() => asList(proposalsState.data), [proposalsState.data])
  const payments = useMemo(() => asList(paymentsState.data), [paymentsState.data])
  const reviews = useMemo(() => asList(reviewsState.data), [reviewsState.data])
  const projects = useMemo(() => asList(projectsState.data), [projectsState.data])
  const activeContracts = contracts.filter((contract) => contract.status === 'ACTIVE')
  const completedContracts = contracts.filter((contract) => contract.status === 'COMPLETED')
  const receivedPayments = payments.filter((payment) => Number(payment.receiverId) === Number(user?.id))
  const completedPayments = receivedPayments.filter((payment) => payment.status === 'COMPLETED')
  const pendingPayments = receivedPayments.filter((payment) => payment.status === 'PENDING')
  const totalEarnings = completedPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0)
  const pendingAmount = pendingPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0)
  const statusCounts = proposals.reduce((counts, proposal) => {
    counts[proposal.status] = (counts[proposal.status] || 0) + 1
    return counts
  }, {})
  const skills = profile?.skills || []
  const portfolio = profile?.portfolioProjects || []
  const completion = profileState.error || profileState.loading || !profile
    ? null
    : 25 + (Boolean(profile.bio?.trim()) ? 25 : 0) + (skills.length > 0 ? 25 : 0) + (portfolio.length > 0 ? 25 : 0)
  const profileSuggestion = !profile?.bio?.trim()
    ? 'Add a short professional bio.'
    : !skills.length
      ? 'Add skills from the catalog.'
      : !portfolio.length
        ? 'Add a portfolio project to complete your profile.'
        : 'Your profile is complete and ready to share.'

  const deadlines = activeContracts.map((contract) => ({
    projectId: contract.project?.id ?? contract.projectId,
    title: contract.project?.title || 'Project title unavailable',
    customer: contract.client?.name || 'Customer',
    date: (() => {
      const projectDeadline = dateValue(contract.project?.deadline)
      const contractEnd = dateValue(contract.endDate)
      const now = Date.now()
      return projectDeadline && projectDeadline.getTime() >= now ? contract.project.deadline : contractEnd && contractEnd.getTime() >= now ? contract.endDate : null
    })()
  })).filter((item) => dateValue(item.date)).sort((a, b) => dateValue(a.date).getTime() - dateValue(b.date).getTime()).slice(0, 5)

  const recentProposals = sortedByDate(proposals, 'updatedAt').slice(0, 4)
  const recentPayments = sortedByDate(receivedPayments).slice(0, 4)
  const recentActivity = [
    ...proposals.map((proposal) => ({
      id: `proposal-${proposal.id}`,
      icon: FileText,
      title: proposal.status === 'PENDING' ? 'Proposal submitted' : `Proposal ${titleCase(proposal.status).toLowerCase()}`,
      description: proposal.project?.title || 'Project title unavailable',
      date: proposal.updatedAt || proposal.createdAt,
      to: '/freelancer/proposals'
    })),
    ...contracts.map((contract) => ({
      id: `contract-${contract.id}`,
      icon: ShieldCheck,
      title: `Contract ${titleCase(contract.status).toLowerCase()}`,
      description: contract.project?.title || 'Project title unavailable',
      date: contract.updatedAt || contract.createdAt,
      to: '/freelancer/contracts'
    })),
    ...receivedPayments.map((payment) => ({
      id: `payment-${payment.id}`,
      icon: CircleDollarSign,
      tone: payment.status === 'COMPLETED' ? 'green' : undefined,
      title: `Payment ${titleCase(payment.status).toLowerCase()}`,
      description: `${payment.contract?.project?.title || 'Contract payment'} · ${money(payment.amount)}`,
      date: payment.updatedAt || payment.createdAt,
      to: '/freelancer/payments'
    })),
    ...reviews.filter((review) => Number(review.reviewedUserId) === Number(user?.id)).map((review) => ({
      id: `review-${review.id}`,
      icon: Star,
      tone: 'green',
      title: 'Review received',
      description: `${review.project?.title || 'Project'} · ${review.rating}/5`,
      date: review.createdAt,
      to: '/freelancer/reviews'
    }))
  ].filter((item) => dateValue(item.date)).sort((a, b) => dateValue(b.date).getTime() - dateValue(a.date).getTime()).slice(0, 6)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const profileTitle = profile?.user?.professionalTitle || user?.professionalTitle

  return (
    <div className="freelancer-dashboard">
      <header className="fd-welcome">
        <div>
          <span className="eyebrow">Freelancer workspace</span>
          <h1>{greeting}, {user?.name || 'there'}</h1>
          <p>{profileTitle || 'Ready to make progress on your next project?'}</p>
        </div>
        <Link className="button button-primary" to="/freelancer/projects"><Search size={16} /> Find work</Link>
      </header>

      <div className="fd-metrics" aria-label="Freelancer overview">
        <Metric icon={FolderKanban} label="Active projects" value={contractsState.loading || contractsState.error ? '—' : activeContracts.length} detail="Projects on active contracts" to="/freelancer/my-projects?status=ACTIVE" />
        <Metric icon={FileText} label="Pending proposals" value={proposalsState.loading || proposalsState.error ? '—' : statusCounts.PENDING || 0} detail="Awaiting a customer response" to="/freelancer/proposals" tone="amber" />
        <Metric icon={Check} label="Completed projects" value={contractsState.loading || contractsState.error ? '—' : completedContracts.length} detail="Completed contracts" to="/freelancer/my-projects?status=COMPLETED" tone="green" />
        <Metric icon={CircleDollarSign} label="Received earnings" value={paymentsState.loading || paymentsState.error ? '—' : money(totalEarnings)} detail={paymentsState.loading || paymentsState.error ? 'Completed payment records' : `${completedPayments.length} completed payment${completedPayments.length === 1 ? '' : 's'}`} to="/freelancer/payments" tone="blue" />
      </div>

      <section className="fd-profile-strength" aria-label="Profile strength">
        <span className="fd-profile-icon"><Sparkles size={18} /></span>
        <div className="fd-profile-copy">
          <div className="fd-profile-title"><strong>Profile strength</strong><span>{completion === null ? '—' : `${completion}%`}</span></div>
          <div className="fd-profile-progress" role="progressbar" aria-label="Profile completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow={completion ?? 0}><span style={{ width: `${completion ?? 0}%` }} /></div>
          <small>{profileState.error ? 'Profile details are temporarily unavailable.' : profileState.loading ? 'Checking your profile details…' : profileSuggestion}</small>
        </div>
        <Link className="text-link" to="/freelancer/profile">{completion === 100 ? 'View profile' : 'Complete profile'} <ArrowRight size={15} /></Link>
      </section>

      <div className="fd-primary-grid">
        <Panel eyebrow="Current commitments" title="Active projects" action={<Link className="text-link" to="/freelancer/my-projects">View all <ArrowRight size={14} /></Link>}>
          <ResourceState loading={contractsState.loading} error={contractsState.error} empty={activeContracts.length === 0 && !contractsState.loading && !contractsState.error ? 'No active projects yet.' : ''} retry={retry} />
          {!contractsState.loading && !contractsState.error && activeContracts.length > 0 && <div className="fd-record-list">{activeContracts.slice(0, 5).map((contract) => <ContractRow key={contract.id} contract={contract} />)}</div>}
          {!contractsState.loading && !contractsState.error && activeContracts.length === 0 && <Link className="fd-empty-action" to="/freelancer/projects">Browse open projects <ArrowRight size={14} /></Link>}
        </Panel>

        <Panel eyebrow="Dates from your active work" title="Upcoming deadlines" className="fd-deadlines-panel">
          <ResourceState loading={contractsState.loading} error={contractsState.error} empty={deadlines.length === 0 && !contractsState.loading && !contractsState.error ? 'No upcoming deadlines' : ''} retry={retry} />
          {!contractsState.loading && !contractsState.error && deadlines.length > 0 && <div className="fd-deadline-list">{deadlines.map((item, index) => <DeadlineRow key={`${item.projectId || item.title}-${index}`} deadline={item} />)}</div>}
        </Panel>
      </div>

      <div className="fd-secondary-grid">
        <Panel eyebrow="Proposal pipeline" title="Your proposals" action={<Link className="text-link" to="/freelancer/proposals">View all proposals <ArrowRight size={14} /></Link>}>
          <ResourceState loading={proposalsState.loading} error={proposalsState.error} empty={proposals.length === 0 && !proposalsState.loading && !proposalsState.error ? 'No proposals yet. Find a project that fits your skills.' : ''} retry={retry} />
          {!proposalsState.loading && !proposalsState.error && proposals.length > 0 && <>
            <div className="fd-proposal-counts">
              {['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'].map((status) => <div key={status}><strong>{statusCounts[status] || 0}</strong><span>{titleCase(status)}</span></div>)}
            </div>
            <div className="fd-record-list">{recentProposals.map((proposal) => <ProposalItem key={proposal.id} proposal={proposal} />)}</div>
          </>}
        </Panel>

        <Panel eyebrow="Money received" title="Earnings" action={<Link className="text-link" to="/freelancer/payments">Payment history <ArrowRight size={14} /></Link>}>
          <ResourceState loading={paymentsState.loading} error={paymentsState.error} empty={receivedPayments.length === 0 && !paymentsState.loading && !paymentsState.error ? 'No payments yet.' : ''} retry={retry} />
          {!paymentsState.loading && !paymentsState.error && receivedPayments.length > 0 && <>
            <div className="fd-earnings-total"><span>Total received</span><strong>{money(totalEarnings)}</strong><small>{pendingAmount > 0 ? `${money(pendingAmount)} in pending payments` : 'Completed payment records only'}</small></div>
            <div className="fd-record-list">{recentPayments.map((payment) => <PaymentItem key={payment.id} payment={payment} />)}</div>
          </>}
        </Panel>
      </div>

      <div className="fd-secondary-grid fd-lower-grid">
        <Panel eyebrow="Open marketplace projects" title="New opportunities" action={<Link className="text-link" to="/freelancer/projects">Find work <ArrowRight size={14} /></Link>}>
          <ResourceState loading={projectsState.loading} error={projectsState.error} empty={projects.length === 0 && !projectsState.loading && !projectsState.error ? 'No open projects right now. Check back as customers publish new work.' : ''} retry={retry} />
          {!projectsState.loading && !projectsState.error && projects.length > 0 && <div className="fd-opportunity-list">{projects.map((project) => <Opportunity key={project.id} project={project} />)}</div>}
        </Panel>

        <Panel eyebrow="From your recent records" title="Recent activity" className="fd-activity-panel">
          {(proposalsState.loading || contractsState.loading || paymentsState.loading || reviewsState.loading) && <div className="fd-state" role="status">Loading recent records…</div>}
          {!proposalsState.loading && !contractsState.loading && !paymentsState.loading && !reviewsState.loading && recentActivity.length === 0 && <ResourceState loading={false} error={[proposalsState, contractsState, paymentsState, reviewsState].find((state) => state.error)?.error} empty="New proposals, contracts, payments, and reviews will appear here." retry={retry} />}
          {recentActivity.length > 0 && <div className="fd-activity-list">{recentActivity.map((item) => <ActivityItem key={item.id} item={item} />)}</div>}
        </Panel>
      </div>

      <Panel eyebrow="Shortcuts" title="Quick actions" className="fd-quick-panel">
        <div className="fd-quick-actions">
          <Link to="/freelancer/projects"><Search size={16} /> Find work</Link>
          <Link to="/freelancer/proposals"><FileText size={16} /> View proposals</Link>
          <Link to="/freelancer/contracts"><ShieldCheck size={16} /> View contracts</Link>
          <Link to="/freelancer/portfolio"><BriefcaseBusiness size={16} /> Manage portfolio</Link>
          <Link to="/freelancer/profile"><Sparkles size={16} /> Complete profile</Link>
        </div>
      </Panel>
    </div>
  )
}
