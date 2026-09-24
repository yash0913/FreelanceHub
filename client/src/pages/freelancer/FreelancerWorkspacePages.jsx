import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, BriefcaseBusiness, CircleDollarSign, FileText, Flag, FolderKanban, Search, ShieldCheck, Star } from 'lucide-react'
import api from '../../services/api'
import './freelancer-records.css'

const unwrap = (response) => response?.data?.data ?? response?.data ?? response
const positiveId = (value) => {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}
const asList = (value) => Array.isArray(value) ? value : []
const money = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  const amount = Number(value)
  return Number.isFinite(amount) ? `₹${amount.toLocaleString('en-IN')}` : '—'
}
const validDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
const dateLabel = (value) => validDate(value)?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) || 'Date unavailable'
const titleCase = (value) => String(value || '').replaceAll('_', ' ').toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase())
const statusClass = (value) => `status status-${String(value || '').toLowerCase()}`
const projectRoute = (projectOrId) => {
  const id = positiveId(typeof projectOrId === 'object' ? projectOrId?.id : projectOrId)
  return id ? `/freelancer/projects/${id}` : null
}

function useRecords(endpoint, emptyMessage) {
  const [state, setState] = useState({ data: [], loading: true, error: '' })
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    setState((current) => ({ ...current, loading: true, error: '' }))
    api.get(endpoint).then((response) => {
      if (active) setState({ data: unwrap(response), loading: false, error: '' })
    }).catch((error) => {
      if (!active) return
      const status = error?.response?.status
      const message = status === 401
        ? 'Your session could not be verified. Please sign in again.'
        : status === 403
          ? 'You do not have permission to view these records.'
          : !error?.response
            ? 'We could not connect. Check your connection and try again.'
            : emptyMessage
      setState({ data: [], loading: false, error: message })
    })
    return () => { active = false }
  }, [endpoint, emptyMessage, reload])
  return { ...state, retry: () => setReload((value) => value + 1) }
}

function PageIntro({ eyebrow, title, description, action }) {
  return <div className="page-intro"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function State({ loading, error, empty, retry }) {
  if (loading) return <div className="frw-state" role="status">Loading your records…</div>
  if (error) return <div className="frw-state frw-error" role="alert"><span>{error}</span><button type="button" onClick={retry}>Try again</button></div>
  if (empty) return <div className="frw-empty"><span className="frw-empty-icon"><FolderKanban size={20} /></span><strong>{empty}</strong></div>
  return null
}

function RecordList({ children }) {
  return <div className="panel frw-list">{children}</div>
}

function ContractRecord({ contract }) {
  const to = projectRoute(contract?.project || contract?.projectId)
  const project = contract?.project?.title || 'Project title unavailable'
  const counterpart = contract?.client?.name || 'Customer unavailable'
  const content = <>
    <span className="frw-record-icon"><BriefcaseBusiness size={17} /></span>
    <span className="frw-record-main"><strong>{project}</strong><small>{counterpart} · {money(contract?.agreedAmount)}</small></span>
    <span className={statusClass(contract?.status)}>{titleCase(contract?.status)}</span>
    <span className="frw-record-dates">{dateLabel(contract?.startDate)}{contract?.endDate ? ` — ${dateLabel(contract.endDate)}` : ''}</span>
    {to && <ArrowRight size={15} className="frw-record-arrow" />}
  </>
  return to ? <Link className="frw-record" to={to}>{content}</Link> : <div className="frw-record frw-record-disabled">{content}</div>
}

function ProposalRecord({ proposal }) {
  const to = projectRoute(proposal?.project || proposal?.projectId)
  const content = <>
    <span className="frw-record-icon"><FileText size={17} /></span>
    <span className="frw-record-main"><strong>{proposal?.project?.title || 'Project title unavailable'}</strong><small>{money(proposal?.proposedPrice)}{proposal?.estimatedDays ? ` · ${proposal.estimatedDays} days estimated` : ''} · Submitted {dateLabel(proposal?.createdAt)}</small></span>
    <span className={statusClass(proposal?.status)}>{titleCase(proposal?.status)}</span>
    {to && <ArrowRight size={15} className="frw-record-arrow" />}
  </>
  return to ? <Link className="frw-record" to={to}>{content}</Link> : <div className="frw-record frw-record-disabled">{content}</div>
}

export function FreelancerMyProjectsPage() {
  const records = useRecords('/contracts/mine', 'We could not load your projects right now. Please try again.')
  const [searchParams, setSearchParams] = useSearchParams()
  const initialStatus = ['ACTIVE', 'COMPLETED', 'OTHER'].includes(searchParams.get('status')) ? searchParams.get('status') : 'ALL'
  const [filter, setFilter] = useState(initialStatus)
  useEffect(() => { setFilter(initialStatus) }, [initialStatus])
  const contracts = useMemo(() => asList(records.data), [records.data])
  const groups = {
    ACTIVE: contracts.filter((item) => item.status === 'ACTIVE'),
    COMPLETED: contracts.filter((item) => item.status === 'COMPLETED'),
    OTHER: contracts.filter((item) => !['ACTIVE', 'COMPLETED'].includes(item.status))
  }
  const visible = filter === 'ALL' ? contracts : groups[filter]
  const selectFilter = (value) => {
    setFilter(value)
    if (value === 'ALL') setSearchParams({}, { replace: true })
    else setSearchParams({ status: value }, { replace: true })
  }
  return <>
    <PageIntro eyebrow="Freelancer workspace" title="My projects" description="See the projects attached to your real contracts, grouped by their current status." action={<Link className="button button-primary" to="/freelancer/projects"><Search size={16} /> Find work</Link>} />
    <div className="frw-filter-row" role="group" aria-label="Filter projects by contract status">
      {[['ALL', 'All', contracts.length], ['ACTIVE', 'Active', groups.ACTIVE.length], ['COMPLETED', 'Completed', groups.COMPLETED.length], ['OTHER', 'Other', groups.OTHER.length]].map(([key, label, count]) => <button key={key} className={`frw-filter ${filter === key ? 'active' : ''}`} type="button" onClick={() => selectFilter(key)}>{label}<span>{count}</span></button>)}
    </div>
    <State loading={records.loading} error={records.error} empty={!visible.length && !records.loading && !records.error ? filter === 'ALL' ? 'No projects yet. Accepted proposals appear here as contracts.' : `No ${titleCase(filter).toLowerCase()} projects.` : ''} retry={records.retry} />
    {!records.loading && !records.error && visible.length > 0 && <RecordList>{visible.map((contract) => <ContractRecord key={contract.id} contract={contract} />)}</RecordList>}
  </>
}

export function FreelancerProposalsPage() {
  const records = useRecords('/proposals/mine', 'We could not load your proposals right now. Please try again.')
  const proposals = useMemo(() => asList(records.data), [records.data])
  const counts = proposals.reduce((acc, item) => { acc[item.status] = (acc[item.status] || 0) + 1; return acc }, {})
  return <>
    <PageIntro eyebrow="Freelancer workspace" title="Your proposals" description="Track submitted offers and see which projects are still waiting on a decision." />
    <div className="frw-status-summary">{['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'].map((status) => <div key={status}><strong>{records.loading || records.error ? '—' : counts[status] || 0}</strong><span>{titleCase(status)}</span></div>)}</div>
    <State loading={records.loading} error={records.error} empty="No proposals yet. Find an open project that fits your skills." retry={records.retry} />
    {!records.loading && !records.error && proposals.length > 0 && <RecordList>{proposals.map((proposal) => <ProposalRecord key={proposal.id} proposal={proposal} />)}</RecordList>}
  </>
}

export function FreelancerContractsPage() {
  const records = useRecords('/contracts/mine', 'We could not load your contracts right now. Please try again.')
  const contracts = useMemo(() => asList(records.data), [records.data])
  return <>
    <PageIntro eyebrow="Freelancer workspace" title="Contracts" description="Review the customer, agreed amount, status, and dates for every engagement." />
    <State loading={records.loading} error={records.error} empty="No contracts yet. An accepted proposal will appear here." retry={records.retry} />
    {!records.loading && !records.error && contracts.length > 0 && <RecordList>{contracts.map((contract) => <ContractRecord key={contract.id} contract={contract} />)}</RecordList>}
  </>
}

export function FreelancerPaymentsPage({ user }) {
  const records = useRecords('/payments/mine', 'We could not load your payment history right now. Please try again.')
  const payments = useMemo(() => asList(records.data).filter((item) => Number(item.receiverId) === Number(user?.id) || Number(item.payerId) === Number(user?.id)), [records.data, user?.id])
  const receivedPayments = payments.filter((item) => Number(item.receiverId) === Number(user?.id))
  const completed = receivedPayments.filter((item) => item.status === 'COMPLETED')
  const total = completed.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const recent = [...payments].sort((a, b) => (validDate(b.createdAt)?.getTime() || 0) - (validDate(a.createdAt)?.getTime() || 0))
  return <>
    <PageIntro eyebrow="Freelancer workspace" title="Payments" description="Review payments recorded for you as the receiver. Completed payments contribute to earnings." />
    <div className="frw-finance-summary"><div><span>Received earnings</span><strong>{records.loading || records.error ? '—' : money(total)}</strong><small>Completed payments received</small></div><div><span>Completed payments</span><strong>{records.loading || records.error ? '—' : completed.length}</strong><small>Out of {records.loading || records.error ? '—' : receivedPayments.length} received records</small></div></div>
    <State loading={records.loading} error={records.error} empty="No payments yet. Received payment records will appear here." retry={records.retry} />
    {!records.loading && !records.error && payments.length > 0 && <RecordList>{recent.map((payment) => {
      const project = payment.contract?.project?.title || 'Contract payment'
      const isReceived = Number(payment.receiverId) === Number(user?.id)
      const counterparty = isReceived ? payment.payer?.name : payment.receiver?.name
      return <div className="frw-record" key={payment.id}><span className={`frw-record-icon ${isReceived ? 'frw-green' : 'frw-amber'}`}><CircleDollarSign size={17} /></span><span className="frw-record-main"><strong>{project}</strong><small>{isReceived ? 'Received from' : 'Paid to'} {counterparty || 'Marketplace user'} · {dateLabel(payment.createdAt)}</small></span><strong className="frw-payment-amount">{money(payment.amount)}</strong><span className={statusClass(payment.status)}>{titleCase(payment.status)}</span></div>
    })}</RecordList>}
  </>
}

export function FreelancerReviewsPage({ user }) {
  const records = useRecords('/reviews/mine', 'We could not load your reviews right now. Please try again.')
  const reviews = useMemo(() => asList(records.data).filter((item) => Number(item.reviewedUserId) === Number(user?.id)), [records.data, user?.id])
  const average = reviews.length ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1) : '—'
  return <>
    <PageIntro eyebrow="Freelancer workspace" title="Reviews" description="Feedback customers have left about your completed work." />
    {reviews.length > 0 && !records.loading && <div className="frw-review-summary"><Star size={18} /><strong>{average}</strong><span>average across {reviews.length} received review{reviews.length === 1 ? '' : 's'}</span></div>}
    <State loading={records.loading} error={records.error} empty="No reviews yet. Customer feedback will appear here after a completed engagement." retry={records.retry} />
    {!records.loading && !records.error && reviews.length > 0 && <div className="frw-review-list">{reviews.map((review) => <article className="panel frw-review-card" key={review.id}><div className="frw-review-top"><div><strong>{review.project?.title || 'Project review'}</strong><small>{review.reviewer?.name || 'Customer'} · {dateLabel(review.createdAt)}</small></div><span className="frw-rating" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(Math.max(0, Math.min(5, Number(review.rating))))}<span>{'★'.repeat(5 - Math.max(0, Math.min(5, Number(review.rating))))}</span></span></div><p>{review.comment || 'No written comment was provided.'}</p></article>)}</div>}
  </>
}

export function FreelancerReportsPage() {
  const records = useRecords('/reports/mine', 'We could not load your reports right now. Please try again.')
  const reports = useMemo(() => asList(records.data), [records.data])
  return <>
    <PageIntro eyebrow="Freelancer workspace" title="Reports" description="Follow reports you have submitted and their current moderation status." />
    <State loading={records.loading} error={records.error} empty="No reports submitted. Reports you file will appear here." retry={records.retry} />
    {!records.loading && !records.error && reports.length > 0 && <RecordList>{reports.map((report) => <div className="frw-record" key={report.id}><span className="frw-record-icon frw-amber"><Flag size={17} /></span><span className="frw-record-main"><strong>{report.reason}</strong><small>Reported user: {report.reportedUser?.name || 'Unavailable'} · Submitted {dateLabel(report.createdAt)}{report.resolvedAt ? ` · Resolved ${dateLabel(report.resolvedAt)}` : ''}</small>{report.description && <small className="frw-report-description">{report.description}</small>}</span><span className={statusClass(report.status)}>{titleCase(report.status)}</span></div>)}</RecordList>}
  </>
}
