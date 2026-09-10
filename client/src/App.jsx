import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowRight, BarChart3, BriefcaseBusiness, Building2, Check, ChevronRight, CircleDollarSign, Flag,
  Clock3, FolderKanban, HeartHandshake, LayoutDashboard, LogIn, LogOut, Menu, MessageSquare,
  MoreHorizontal, Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles, Star, Tag, UserRound,
  Users, X, Zap
} from 'lucide-react'
import api from './services/api'
import './index.css'

const AuthContext = createContext(null)
const roleLabel = { CUSTOMER: 'Customer', FREELANCER: 'Freelancer', ADMIN: 'Admin' }
const currency = (value) => value === null || value === undefined || value === '' ? '—' : `₹${Number(value).toLocaleString('en-IN')}`
const dateLabel = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const titleCase = (value) => String(value || '').replaceAll('_', ' ').toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase())
const getHome = (user) => user?.role === 'ADMIN' ? '/admin/dashboard' : user?.role === 'CUSTOMER' ? '/customer/dashboard' : '/freelancer/dashboard'
const unwrap = (response) => response?.data?.data ?? response?.data ?? response
const apiError = (error) => error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.'

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    api.get('/auth/me').then((response) => {
      const next = unwrap(response)
      setUser(next)
      localStorage.setItem('user', JSON.stringify(next))
    }).catch(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }).finally(() => setLoading(false))
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    async login(email, password) {
      const response = await api.post('/auth/login', { email, password })
      const payload = unwrap(response)
      localStorage.setItem('token', payload.token)
      localStorage.setItem('user', JSON.stringify(payload.user))
      setUser(payload.user)
      return payload.user
    },
    async register(role, values) {
      const endpoint = role === 'FREELANCER' ? '/auth/register/freelancer' : '/auth/register/customer'
      return unwrap(await api.post(endpoint, values))
    },
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    },
    refresh() {
      return api.get('/auth/me').then((response) => {
        const next = unwrap(response)
        setUser(next)
        localStorage.setItem('user', JSON.stringify(next))
        return next
      })
    }
  }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
const useAuth = () => useContext(AuthContext)

function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen label="Restoring your workspace" />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={getHome(user)} replace />
  return children
}

function LoadingScreen({ label = 'Loading' }) {
  return <div className="loading-screen"><div className="spinner" /><p>{label}</p></div>
}

function Toast({ message, onClose }) {
  if (!message) return null
  return <div className="toast"><Check size={16} /><span>{message}</span><button onClick={onClose}><X size={15} /></button></div>
}

function StatusBadge({ value }) {
  const tone = String(value || '').toLowerCase()
  return <span className={`status status-${tone}`}>{titleCase(value)}</span>
}

function Avatar({ name, size = 'md' }) {
  const initials = String(name || 'FH').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return <div className={`avatar avatar-${size}`}>{initials}</div>
}

function EmptyState({ icon: Icon = FolderKanban, title, description, action }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={22} /></div><h3>{title}</h3><p>{description}</p>{action}</div>
}

function ErrorState({ message }) {
  return <div className="error-state"><X size={18} /><span>{message}</span></div>
}

function useFetch(url, params = {}, deps = []) {
  const [state, setState] = useState({ data: null, loading: Boolean(url), error: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const refetch = () => setReloadKey((k) => k + 1)
  const setData = (updater) => setState((prev) => ({
    ...prev,
    data: typeof updater === 'function' ? updater(prev.data) : updater
  }))

  useEffect(() => {
    let active = true
    if (!url) {
      setState({ data: null, loading: false, error: '' })
      return () => { active = false }
    }
    setState((prev) => ({ ...prev, loading: true, error: '' }))
    api.get(url, { params }).then((response) => {
      if (active) setState({ data: unwrap(response), loading: false, error: '' })
    }).catch((error) => {
      if (active) setState({ data: null, loading: false, error: apiError(error) })
    })
    return () => { active = false }
  }, [url, JSON.stringify(params), reloadKey, ...deps])

  return { ...state, refetch, setData }
}

function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>
}

function Input({ label, hint, ...props }) {
  return <label className="field">{label && <span>{label}</span>}<input {...props} />{hint && <small>{hint}</small>}</label>
}

function Select({ label, children, ...props }) {
  return <label className="field">{label && <span>{label}</span>}<select {...props}>{children}</select></label>
}

function Textarea({ label, ...props }) {
  return <label className="field">{label && <span>{label}</span>}<textarea {...props} /></label>
}

function PublicNav() {
  const { user } = useAuth()
  return <header className="public-nav"><Link className="brand" to="/"><span className="brand-mark">F</span><span>freelance<span className="brand-blue">hub</span></span></Link><nav className="public-links"><Link to="/projects">Find work</Link><Link to="/freelancers">Find freelancers</Link><a href="#how-it-works">How it works</a></nav><div className="nav-actions">{user ? <Link className="button button-primary button-small" to={getHome(user)}>Open workspace <ArrowRight size={15} /></Link> : <><Link className="button button-ghost button-small" to="/login">Log in</Link><Link className="button button-primary button-small" to="/register/customer">Join free <ArrowRight size={15} /></Link></>}</div></header>
}

function LandingPage() {
  const categories = useFetch('/categories')
  const projects = useFetch('/projects', { status: 'OPEN', limit: 3 })
  const freelancers = useFetch('/freelancers', { limit: 3 })
  return <div className="public-page"><PublicNav /><main>
    <section className="hero"><div className="hero-copy"><div className="eyebrow"><Sparkles size={15} /> Built for ambitious teams in India</div><h1>Great work starts with the <span>right people.</span></h1><p>FreelanceHub connects Indian businesses with independent talent who care about craft, clarity, and outcomes.</p><div className="hero-search"><Search size={19} /><input placeholder="Search projects, skills, or talent" /><Link to="/projects"><ArrowRight size={19} /></Link></div><div className="hero-actions"><Link className="button button-primary" to="/projects">Explore opportunities <ArrowRight size={16} /></Link><Link className="button button-ghost" to="/register/customer">Post a project</Link></div><div className="trust-row"><div className="avatar-stack"><Avatar name="Asha Mehta" size="sm" /><Avatar name="Rohan Iyer" size="sm" /><Avatar name="Meera Shah" size="sm" /></div><span>Trusted by teams building the next big thing</span></div></div><div className="hero-art"><div className="art-orb orb-one" /><div className="art-orb orb-two" /><div className="hero-card hero-card-main"><div className="mini-label">PROJECT MATCH</div><div className="match-row"><div className="match-icon"><Zap size={19} /></div><div><strong>Product designer</strong><span>4 strong matches found</span></div><span className="match-score">94%</span></div><div className="match-line"><span /><span /><span /></div><div className="match-bottom"><span>₹60k–₹90k</span><span>Remote · 2 weeks</span></div></div><div className="hero-card hero-card-float"><div className="float-icon"><Check size={16} /></div><div><strong>Contract accepted</strong><span>Just now</span></div></div><div className="hero-grid-line line-one" /><div className="hero-grid-line line-two" /></div></section>
    <section className="logo-strip"><span>Designed for modern teams</span><div><strong>pixel<span>craft</span></strong><strong>northstar</strong><strong>loop<span>labs</span></strong><strong>ORBIT</strong></div></section>
    <section className="section-block" id="how-it-works"><div className="section-heading"><div><div className="eyebrow">A better way to work</div><h2>From first brief to final handoff.</h2></div><p>Everything you need to find the right fit, make work happen, and keep relationships moving forward.</p></div><div className="steps-grid"><div className="step-card"><span>01</span><Search size={22} /><h3>Discover</h3><p>Search real projects and specialized freelancers by the signals that matter.</p></div><div className="step-card featured"><span>02</span><HeartHandshake size={22} /><h3>Collaborate</h3><p>Align on scope, proposals, and communication in one transparent workspace.</p></div><div className="step-card"><span>03</span><ShieldCheck size={22} /><h3>Deliver</h3><p>Track contracts, reviews, and payment records as work moves to completion.</p></div></div></section>
    <section className="section-block tinted"><div className="section-heading"><div><div className="eyebrow">Live marketplace</div><h2>Find momentum, not noise.</h2></div><Link className="text-link" to="/projects">View all projects <ArrowRight size={16} /></Link></div><div className="public-grid">{projects.loading ? <LoadingInline /> : projects.error ? <ErrorState message={projects.error} /> : projects.data?.items?.length ? projects.data.items.map((project) => <ProjectCard key={project.id} project={project} />) : <EmptyState title="The marketplace is warming up" description="New opportunities will appear here as they are published." />}</div></section>
    <section className="section-block"><div className="section-heading"><div><div className="eyebrow">Specialized talent</div><h2>People who make the difference.</h2></div><Link className="text-link" to="/freelancers">Browse talent <ArrowRight size={16} /></Link></div><div className="talent-grid">{freelancers.loading ? <LoadingInline /> : freelancers.error ? <ErrorState message={freelancers.error} /> : freelancers.data?.items?.length ? freelancers.data.items.map((profile) => <FreelancerCard key={profile.id} profile={profile} />) : <EmptyState icon={Users} title="Talent profiles are loading" description="Explore the marketplace once the backend is available." />}</div></section>
    <section className="section-block category-section"><div className="section-heading"><div><div className="eyebrow">Explore by discipline</div><h2>Find your next advantage.</h2></div></div><div className="category-pills">{categories.loading ? <span className="muted">Loading categories…</span> : categories.data?.length ? categories.data.slice(0, 8).map((category) => <Link key={category.id} to={`/projects?categoryId=${category.id}`} className="category-pill"><Tag size={15} />{category.name}<ChevronRight size={14} /></Link>) : <span className="muted">Categories will appear when the API is connected.</span>}</div></section>
    <section className="cta-banner"><div><div className="eyebrow light">Make your next move</div><h2>Build better, together.</h2><p>Join a marketplace designed around meaningful work and lasting partnerships.</p></div><div className="cta-actions"><Link className="button button-white" to="/register/customer">Start as a customer <ArrowRight size={16} /></Link><Link className="button button-outline-white" to="/register/freelancer">Offer your expertise</Link></div></section>
  </main><footer className="footer"><div className="brand"><span className="brand-mark">F</span><span>freelance<span className="brand-blue">hub</span></span></div><span>© 2026 FreelanceHub. Built for ambitious work.</span><div><Link to="/login">Sign in</Link><Link to="/register/customer">Join the network</Link></div></footer></div>
}

function LoadingInline() { return <div className="loading-inline"><div className="spinner" /><span>Loading live data…</span></div> }

function AuthPage({ registerRole }) {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState(registerRole ? 'register' : 'login')
  const [role, setRole] = useState(registerRole || 'CUSTOMER')
  const [form, setForm] = useState({ name: '', professionalTitle: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  useEffect(() => { if (user) navigate(getHome(user), { replace: true }) }, [user, navigate])
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  const submit = async (event) => {
    event.preventDefault(); setError(''); setSubmitting(true)
    try {
      if (mode === 'login') await login(form.email, form.password)
      else { await register(role, form); setMode('login'); setError('Account created. Sign in to enter your workspace.') }
    } catch (err) { setError(apiError(err)) } finally { setSubmitting(false) }
  }
  return <div className="auth-page"><div className="auth-side"><Link className="brand brand-on-dark" to="/"><span className="brand-mark">F</span><span>freelance<span className="brand-blue">hub</span></span></Link><div className="auth-side-copy"><div className="eyebrow light">Work, with intention.</div><h1>Find the work that moves you forward.</h1><p>A focused marketplace for Indian customers, independent talent, and the partnerships between them.</p><div className="auth-quote"><span>“</span><p>Great work happens when clarity meets capability.</p></div></div><span className="auth-side-foot">White + blue. Clear by design.</span></div><div className="auth-panel"><div className="auth-mobile-brand"><Link className="brand" to="/"><span className="brand-mark">F</span><span>freelance<span className="brand-blue">hub</span></span></Link></div><div className="auth-form-wrap"><div className="auth-kicker">{mode === 'login' ? 'Welcome back' : 'Join the network'}</div><h2>{mode === 'login' ? 'Sign in to your workspace' : 'Create your FreelanceHub account'}</h2><p className="muted">{mode === 'login' ? 'Your next great project is waiting.' : 'Choose how you want to contribute to the marketplace.'}</p>{mode === 'register' && <div className="role-switch"><button className={role === 'CUSTOMER' ? 'active' : ''} onClick={() => setRole('CUSTOMER')} type="button"><Building2 size={17} /><span>Hire talent<small>For customers</small></span></button><button className={role === 'FREELANCER' ? 'active' : ''} onClick={() => setRole('FREELANCER')} type="button"><BriefcaseBusiness size={17} /><span>Find work<small>For freelancers</small></span></button></div>}{error && <div className={`form-alert ${error.startsWith('Account') ? 'success-alert' : ''}`}>{error}</div>}<form onSubmit={submit}>{mode === 'register' && <><Input label="Full name" value={form.name} onChange={set('name')} placeholder="e.g. Ananya Sharma" required />{role === 'FREELANCER' && <Input label="Professional title" value={form.professionalTitle} onChange={set('professionalTitle')} placeholder="e.g. Full-stack developer" required />}</>}<Input label="Email address" type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" required /><Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" minLength={6} required />{mode === 'register' && <Input label="Confirm password" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat your password" minLength={6} required />}<Button className="button-full" disabled={submitting}>{submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={16} /></Button></form><p className="auth-switch">{mode === 'login' ? 'New to FreelanceHub?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p></div></div></div>
}

const customerNav = [['Dashboard', '/customer/dashboard', LayoutDashboard], ['My projects', '/customer/projects', FolderKanban], ['Find freelancers', '/customer/freelancers', Users], ['Proposals', '/customer/proposals', BriefcaseBusiness], ['Contracts', '/customer/contracts', ShieldCheck], ['Messages', '/customer/messages', MessageSquare], ['Payments', '/customer/payments', CircleDollarSign], ['Reviews', '/customer/reviews', Star], ['Reports', '/customer/reports', FlagIcon], ['Profile', '/customer/profile', UserRound], ['Settings', '/customer/settings', SlidersHorizontal]]
const freelancerNav = [['Dashboard', '/freelancer/dashboard', LayoutDashboard], ['Find work', '/freelancer/projects', Search], ['My proposals', '/freelancer/proposals', BriefcaseBusiness], ['Contracts', '/freelancer/contracts', ShieldCheck], ['Portfolio', '/freelancer/portfolio', Sparkles], ['Messages', '/freelancer/messages', MessageSquare], ['Payments', '/freelancer/payments', CircleDollarSign], ['Reviews', '/freelancer/reviews', Star], ['Reports', '/freelancer/reports', FlagIcon], ['Profile', '/freelancer/profile', UserRound], ['Settings', '/freelancer/settings', SlidersHorizontal]]
const adminNav = [['Overview', '/admin/dashboard', LayoutDashboard], ['Users', '/admin/users', Users], ['Projects', '/admin/projects', FolderKanban], ['Moderation', '/admin/reports', ShieldCheck], ['Catalog', '/admin/catalog', Tag], ['Payments', '/admin/payments', CircleDollarSign]]
function FlagIcon(props) { return <Flag size={17} {...props} /> }

function AppShell({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const nav = user?.role === 'ADMIN' ? adminNav : user?.role === 'CUSTOMER' ? customerNav : freelancerNav
  return <div className="app-shell"><aside className={`sidebar ${open ? 'sidebar-open' : ''}`}><div className="sidebar-top"><Link className="brand" to={getHome(user)} onClick={() => setOpen(false)}><span className="brand-mark">F</span><span>freelance<span className="brand-blue">hub</span></span></Link><button className="sidebar-close" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="workspace-label">{user?.role === 'ADMIN' ? 'Operations' : 'Workspace'}</div><nav className="side-nav">{nav.map(([label, path, Icon]) => <Link key={path} className={location.pathname === path || (path !== getHome(user) && location.pathname.startsWith(path)) ? 'active' : ''} to={path} onClick={() => setOpen(false)}><Icon size={18} /><span>{label}</span>{label === 'Messages' && <span className="nav-dot" />}</Link>)}</nav><div className="sidebar-bottom"><div className="side-privacy"><ShieldCheck size={16} /><span><strong>Secure workspace</strong><small>Your data stays yours.</small></span></div><button className="logout-link" onClick={logout}><LogOut size={17} /> Sign out</button></div></aside><div className="shell-content"><header className="shell-header"><button className="mobile-menu" onClick={() => setOpen(true)}><Menu size={20} /></button><div className="header-context"><span className="header-kicker">{user?.role === 'ADMIN' ? 'FreelanceHub operations' : 'Good work starts here'}</span><strong>{user?.role === 'ADMIN' ? 'Platform overview' : `Welcome back, ${user?.name?.split(' ')[0]}`}</strong></div><div className="header-actions"><Link className="icon-button" to={user?.role === 'FREELANCER' ? '/freelancer/messages' : user?.role === 'CUSTOMER' ? '/customer/messages' : '/admin/reports'}><MessageSquare size={18} /><span className="header-dot" /></Link><Link className="user-chip" to={`/${user?.role?.toLowerCase()}/profile`}><Avatar name={user?.name} size="sm" /><span className="user-chip-copy"><strong>{user?.name}</strong><small>{roleLabel[user?.role]}</small></span><ChevronRight size={15} /></Link></div></header><main className="shell-main">{children}</main></div></div>
}

function PageIntro({ eyebrow, title, description, action }) {
  return <div className="page-intro"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function StatCard({ icon: Icon, label, value, helper, tone = 'blue' }) {
  return <div className="stat-card"><div className={`stat-icon stat-${tone}`}><Icon size={19} /></div><div><span>{label}</span><strong>{value ?? '—'}</strong><small>{helper}</small></div></div>
}

function DashboardPage() {
  const { user } = useAuth()
  const isAdmin = user.role === 'ADMIN'
  const isFreelancer = user.role === 'FREELANCER'
  const stats = useFetch(isAdmin ? '/admin/stats' : '/contracts/mine')
  const projects = useFetch(isAdmin ? '/admin/projects' : user.role === 'CUSTOMER' ? '/projects/mine' : '/proposals/mine', { limit: 6 })
  const conversations = useFetch(isAdmin ? '' : '/conversations')
  const profile = useFetch(isFreelancer ? '/profile' : '')
  const adminReportsState = useFetch(isAdmin ? '/admin/reports' : '', { limit: 6 })
  const payments = useFetch(isFreelancer ? '/payments/mine' : '')
  const opportunities = useFetch(isFreelancer ? '/projects' : '', { status: 'OPEN', limit: 3, sort: 'newest' })
  const dashboardStats = isAdmin ? stats.data : null
  const projectItems = projects.data?.items || projects.data || []
  const conversationCount = conversations.data?.length ?? 0
  const activeContracts = isAdmin ? dashboardStats?.contracts : (stats.data || []).filter((item) => item.status === 'ACTIVE').length
  const primaryLabel = user.role === 'CUSTOMER' ? 'Posted projects' : isFreelancer ? 'Submitted proposals' : 'Marketplace projects'

  // Dynamic Profile Completion calculation:
  // Base account/profile = 25%
  // Bio filled = +25%
  // At least one skill = +25%
  // At least one portfolio item = +25%
  const hasBio = Boolean(profile.data?.bio && profile.data.bio.trim())
  const hasSkills = Boolean(profile.data?.skills && profile.data.skills.length > 0)
  const hasPortfolio = Boolean(profile.data?.portfolioProjects && profile.data.portfolioProjects.length > 0)
  const completionPct = profile.data ? 25 + (hasBio ? 25 : 0) + (hasSkills ? 25 : 0) + (hasPortfolio ? 25 : 0) : 25

  return <><PageIntro eyebrow={isAdmin ? 'Operations dashboard' : `${roleLabel[user.role]} workspace`} title={isAdmin ? 'Platform, at a glance.' : `Your work, ${user.name?.split(' ')[0]}.`} description={isAdmin ? 'Monitor the marketplace, trust signals, and business activity from one place.' : user.role === 'CUSTOMER' ? 'Keep your projects moving and your freelancer relationships clear.' : 'Find your next opportunity and keep every commitment in view.'} action={user.role === 'CUSTOMER' ? <Link className="button button-primary" to="/customer/projects?new=1"><Plus size={17} /> Post a project</Link> : isFreelancer ? <Link className="button button-primary" to="/freelancer/projects"><Search size={17} /> Find work</Link> : <Link className="button button-primary" to="/admin/reports"><ShieldCheck size={17} /> Review queue</Link>} /><div className="stats-grid">{isAdmin ? <><StatCard icon={Users} label="Total users" value={dashboardStats?.users} helper={`${dashboardStats?.customers ?? '—'} customers · ${dashboardStats?.freelancers ?? '—'} freelancers`} /><StatCard icon={FolderKanban} label="Open projects" value={dashboardStats?.openProjects} helper={`${dashboardStats?.projects ?? '—'} total projects`} tone="violet" /><StatCard icon={BriefcaseBusiness} label="Proposals" value={dashboardStats?.proposals} helper={`${dashboardStats?.contracts ?? '—'} contracts created`} tone="green" /><StatCard icon={CircleDollarSign} label="Payment volume" value={currency(dashboardStats?.paymentVolume)} helper="Recorded payment value" tone="amber" /></> : <><StatCard icon={FolderKanban} label={primaryLabel} value={projectItems.length} helper="Live records from your account" /><StatCard icon={ShieldCheck} label="Active contracts" value={activeContracts} helper="Current engagements" tone="violet" /><StatCard icon={MessageSquare} label="Recent conversations" value={conversationCount} helper="Keep relationships moving" tone="green" /><StatCard icon={CircleDollarSign} label="Recorded earnings" value={currency((payments.data || []).filter((item) => item.receiverId === user.id && item.status === 'COMPLETED').reduce((sum, item) => sum + Number(item.amount || 0), 0))} helper="Completed payment records" tone="amber" /></>}</div><div className="dashboard-grid"><section className="panel"><div className="panel-heading"><div><span className="panel-eyebrow">{isAdmin ? 'Marketplace pulse' : user.role === 'CUSTOMER' ? 'Your projects' : 'Your proposals'}</span><h2>{isAdmin ? 'Recent platform activity' : user.role === 'CUSTOMER' ? 'Projects that need your attention' : 'Applications in motion'}</h2></div><Link className="text-link" to={isAdmin ? '/admin/projects' : user.role === 'CUSTOMER' ? '/customer/projects' : '/freelancer/proposals'}>View all <ArrowRight size={15} /></Link></div>{projects.loading ? <LoadingInline /> : projects.error ? <ErrorState message={projects.error} /> : projectItems.length ? <div className="activity-list">{projectItems.slice(0, 5).map((item) => <ActivityRow key={item.id} item={item} type={isAdmin || user.role === 'CUSTOMER' ? 'project' : 'proposal'} />)}</div> : <EmptyState title="Nothing needs your attention yet" description="Your live marketplace activity will appear here." />}</section><section className="panel accent-panel"><div className="panel-heading"><div><span className="panel-eyebrow">Workspace signal</span><h2>{isFreelancer ? 'Profile momentum' : 'Stay close to the work'}</h2></div><Sparkles size={19} className="panel-star" /></div>{isFreelancer && profile.data ? <><div className="completion-header"><strong>{completionPct === 100 ? 'Profile complete' : completionPct >= 75 ? 'Profile in good shape' : 'Complete your profile'}</strong><span>{completionPct}%</span></div><div className="progress"><span style={{ width: `${completionPct}%` }} /></div><p className="panel-copy">{completionPct === 100 ? 'Your profile, skills, and portfolio are published and fully visible to clients across India.' : 'Add a thoughtful bio, relevant skills, and portfolio pieces to make it easier for the right projects to find you.'}</p><Link className="button button-dark button-small" to="/freelancer/profile">Improve profile <ArrowRight size={15} /></Link></> : <><div className="signal-number">{isAdmin ? dashboardStats?.pendingReports ?? '—' : conversationCount}</div><p className="panel-copy">{isAdmin ? 'reports are currently waiting for moderation.' : 'conversations are active in your workspace. Keep communication clear and timely.'}</p><Link className="button button-dark button-small" to={isAdmin ? '/admin/reports' : user.role === 'CUSTOMER' ? '/customer/proposals' : '/freelancer/proposals'}>Open workspace <ArrowRight size={15} /></Link></>}</section></div>{isFreelancer && <section className="panel opportunity-panel"><div className="panel-heading"><div><span className="panel-eyebrow">Live marketplace</span><h2>New opportunities for you</h2></div><Link className="text-link" to="/freelancer/projects">Find more <ArrowRight size={15} /></Link></div>{opportunities.loading ? <LoadingInline /> : opportunities.error ? <ErrorState message={opportunities.error} /> : opportunities.data?.items?.length ? <div className="public-grid">{opportunities.data.items.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : <EmptyState icon={BriefcaseBusiness} title="No new opportunities yet" description="Open projects will appear here when customers publish them." />}</section>}</>}


function ActivityRow({ item, type }) {
  const { user } = useAuth()
  const project = type === 'project' ? item : item.project
  const targetId = project?.id || item.projectId
  const destination = user?.role === 'CUSTOMER' && targetId ? `/customer/projects/${targetId}` : `/project/${targetId || ''}`
  return <Link to={destination} className="activity-row"><div className="activity-avatar"><FolderKanban size={17} /></div><div className="activity-copy"><strong>{project?.title || 'Untitled project'}</strong><span>{type === 'proposal' ? `Proposed ${currency(item.proposedPrice)}` : `${project?.category?.name || 'Marketplace'} · ${dateLabel(project?.createdAt)}`}</span></div><StatusBadge value={item.status || project?.status || 'OPEN'} /><ChevronRight size={16} className="row-chevron" /></Link>
}

function ProjectCard({ project }) {
  const { user } = useAuth()
  const detailUrl = user?.role === 'CUSTOMER' && project.client?.id === user.id
    ? `/customer/projects/${project.id}`
    : `/project/${project.id}`
  return <Link className="project-card" to={detailUrl}><div className="card-topline"><span className="category-label">{project.category?.name || 'Independent project'}</span><StatusBadge value={project.status} /></div><h3>{project.title}</h3><p>{String(project.description || '').slice(0, 110)}{String(project.description || '').length > 110 ? '…' : ''}</p><div className="tag-row">{(project.requiredSkills || []).slice(0, 3).map(({ skill }) => <span key={skill.id}>{skill.name}</span>)}</div><div className="card-footer"><span><strong>{currency(project.budget)}</strong><small> budget</small></span><span>{project._count?.proposals ?? 0} proposals <ChevronRight size={14} /></span></div></Link>
}

function FreelancerCard({ profile }) {
  return <Link className="freelancer-card" to={`/freelancer/${profile.id}`}><div className="freelancer-card-top"><Avatar name={profile.user?.name} /><span className="availability-dot" /></div><h3>{profile.user?.name || 'Freelancer'}</h3><p>{profile.user?.professionalTitle || 'Independent professional'}</p><div className="talent-meta"><span><Star size={14} fill="currentColor" /> 4.9</span><span>{currency(profile.hourlyRate)} / hr</span></div><div className="tag-row">{(profile.skills || []).slice(0, 3).map(({ skill }) => <span key={skill.id}>{skill.name}</span>)}</div></Link>
}

function Filters({ kind, values, setValues, categories, skills }) {
  return <div className="filters"><div className="search-filter"><Search size={17} /><input placeholder={`Search ${kind === 'projects' ? 'projects and skills' : 'freelancers'}`} value={values.q || ''} onChange={(event) => setValues({ ...values, q: event.target.value })} /></div><Select value={values.categoryId || ''} onChange={(event) => setValues({ ...values, categoryId: event.target.value })}><option value="">All categories</option>{(categories || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select value={values.skillId || ''} onChange={(event) => setValues({ ...values, skillId: event.target.value })}><option value="">Any skill</option>{(skills || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select value={values.sort || ''} onChange={(event) => setValues({ ...values, sort: event.target.value })}><option value="">Newest first</option><option value="oldest">Oldest first</option><option value="budget_low">Budget: low to high</option><option value="budget_high">Budget: high to low</option></Select></div>
}

function ProjectsPage({ mine = false }) {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [values, setValues] = useState({ q: '', categoryId: searchParams.get('categoryId') || '', skillId: '', sort: '', status: 'OPEN' })
  const [myFilter, setMyFilter] = useState({ status: 'ALL', q: '' })
  const [showForm, setShowForm] = useState(searchParams.get('new') === '1')
  const categories = useFetch('/categories')
  const skills = useFetch('/skills')
  const state = useFetch(mine ? '/projects/mine' : '/projects', mine ? {} : values, [mine, values])
  const [message, setMessage] = useState('')

  const handleCreated = (createdProject, text) => {
    setShowForm(false)
    setMessage(text)
    if (searchParams.get('new')) {
      searchParams.delete('new')
      setSearchParams(searchParams, { replace: true })
    }
    if (createdProject && createdProject.id) {
      state.setData((prev) => {
        if (!Array.isArray(prev)) return [createdProject]
        return [createdProject, ...prev.filter((p) => p.id !== createdProject.id)]
      })
    }
    state.refetch()
  }

  if (mine) {
    const rawList = Array.isArray(state.data) ? state.data : []
    const filteredList = rawList.filter((project) => {
      if (myFilter.status !== 'ALL' && project.status !== myFilter.status) return false
      if (myFilter.q) {
        const query = myFilter.q.toLowerCase()
        const titleMatch = project.title?.toLowerCase().includes(query)
        const descMatch = project.description?.toLowerCase().includes(query)
        if (!titleMatch && !descMatch) return false
      }
      return true
    })

    return (
      <>
        <PageIntro
          eyebrow="Customer workspace"
          title="Your project desk."
          description="Publish clear briefs, track proposals, and manage your engagements from one place."
          action={
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? <X size={17} /> : <Plus size={17} />} {showForm ? 'Close form' : 'New project'}
            </Button>
          }
        />
        {message && (
          <div className="success-banner" style={{ marginBottom: '20px' }}>
            <Check size={17} />
            <span>{message}</span>
            <button onClick={() => setMessage('')} style={{ marginLeft: 'auto', background: 'transparent', border: 0, cursor: 'pointer' }}><X size={15} /></button>
          </div>
        )}
        {showForm && (
          <ProjectForm
            categories={categories.data}
            skills={skills.data}
            onDone={handleCreated}
            onCancel={() => setShowForm(false)}
          />
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              ['ALL', 'All projects'],
              ['OPEN', 'Open'],
              ['IN_PROGRESS', 'In progress'],
              ['COMPLETED', 'Completed'],
              ['CANCELLED', 'Cancelled']
            ].map(([statusKey, label]) => {
              const count = statusKey === 'ALL' ? rawList.length : rawList.filter((p) => p.status === statusKey).length
              const isActive = myFilter.status === statusKey
              return (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => setMyFilter((f) => ({ ...f, status: statusKey }))}
                  className={`button button-small ${isActive ? 'button-dark' : 'button-outline'}`}
                  style={{ borderRadius: '20px', fontSize: '12px' }}
                >
                  {label} <span style={{ opacity: 0.65, marginLeft: '4px' }}>({count})</span>
                </button>
              )
            })}
          </div>

          <div className="search-filter" style={{ minWidth: '220px', maxWidth: '320px', height: '36px', minHeight: '36px' }}>
            <Search size={15} />
            <input
              placeholder="Search your projects…"
              value={myFilter.q}
              onChange={(e) => setMyFilter((f) => ({ ...f, q: e.target.value }))}
            />
            {myFilter.q && (
              <button type="button" onClick={() => setMyFilter((f) => ({ ...f, q: '' }))} style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {state.loading ? (
          <LoadingInline />
        ) : state.error ? (
          <ErrorState message={state.error} />
        ) : filteredList.length ? (
          <div className="project-list">
            {filteredList.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        ) : rawList.length ? (
          <EmptyState
            title="No matching projects"
            description="No projects match the selected status or search filter."
            action={<Button variant="outline" onClick={() => setMyFilter({ status: 'ALL', q: '' })}>Clear filters</Button>}
          />
        ) : (
          <EmptyState
            title="No projects yet"
            description="Publish your first project brief and discover top independent talent."
            action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Post a project</Button>}
          />
        )}
      </>
    )
  }

  return (
    <>
      <PageIntro
        eyebrow="Open marketplace"
        title="Find work worth doing."
        description="Search the live project marketplace by category, skill, and budget signal."
        action={user ? <Link className="button button-ghost" to={getHome(user)}>Back to workspace <ArrowRight size={15} /></Link> : null}
      />
      <Filters kind="projects" values={values} setValues={setValues} categories={categories.data} skills={skills.data} />
      {state.loading ? (
        <LoadingInline />
      ) : state.error ? (
        <ErrorState message={state.error} />
      ) : (
        <>
          <div className="result-summary">
            <span><strong>{state.data?.pagination?.total ?? state.data?.length ?? 0}</strong> opportunities</span>
            <span className="muted">Sorted by marketplace activity</span>
          </div>
          <div className="public-grid project-results">
            {state.data?.items?.length ? (
              state.data.items.map((project) => <ProjectCard key={project.id} project={project} />)
            ) : (
              <EmptyState title="No projects match those filters" description="Try a broader search or check back soon for new briefs." />
            )}
          </div>
        </>
      )}
    </>
  )
}

function ProjectRow({ project }) {
  return (
    <Link className="project-row" to={`/customer/projects/${project.id}`}>
      <div className="project-row-icon"><FolderKanban size={18} /></div>
      <div className="project-row-copy">
        <strong>{project.title}</strong>
        <span>
          {project.category?.name || 'Uncategorized'} · Posted {dateLabel(project.createdAt)}
          {project.requiredSkills?.length ? ` · ${project.requiredSkills.map(({ skill }) => skill.name).slice(0, 3).join(', ')}` : ''}
        </span>
      </div>
      <div className="project-row-budget">
        <strong>{currency(project.budget)}</strong>
        <span>{project._count?.proposals ?? 0} proposal{project._count?.proposals === 1 ? '' : 's'}</span>
      </div>
      <StatusBadge value={project.status} />
      <ChevronRight size={17} />
    </Link>
  )
}

function ProjectForm({ categories, skills, onDone, initialData = null, isEditing = false, onCancel }) {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    budget: initialData?.budget ? String(initialData.budget) : '',
    deadline: initialData?.deadline ? String(initialData.deadline).slice(0, 10) : '',
    categoryId: initialData?.categoryId ? String(initialData.categoryId) : '',
    experienceLevel: initialData?.experienceLevel || 'INTERMEDIATE',
    skillIds: initialData?.requiredSkills ? initialData.requiredSkills.map(({ skill }) => skill.id) : []
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })
  const toggleSkill = (id) => setForm({
    ...form,
    skillIds: form.skillIds.includes(id) ? form.skillIds.filter((item) => item !== id) : [...form.skillIds, id]
  })

  const submit = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (isEditing && initialData?.id) {
        const response = await api.patch(`/projects/${initialData.id}`, form)
        const updated = unwrap(response)
        onDone(updated, 'Project updated successfully.')
      } else {
        const response = await api.post('/projects', form)
        const created = unwrap(response)
        onDone(created, 'Project published to the marketplace.')
      }
    } catch (err) {
      setError(apiError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="panel form-panel" onSubmit={submit} style={{ marginBottom: '24px' }}>
      <div className="panel-heading">
        <div>
          <span className="panel-eyebrow">{isEditing ? 'Update Project' : 'Project brief'}</span>
          <h2>{isEditing ? 'Edit project brief' : 'Make the right people lean in.'}</h2>
        </div>
        <span className="required-note">All fields with * are required</span>
      </div>
      {error && <ErrorState message={error} />}
      <div className="form-grid">
        <Input
          label="Project title *"
          placeholder="e.g. Build a customer insights dashboard"
          value={form.title}
          onChange={update('title')}
          required
        />
        <Select label="Category" value={form.categoryId} onChange={update('categoryId')}>
          <option value="">Select a category</option>
          {(categories || []).map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </Select>
        <Textarea
          label="Description *"
          placeholder="Share the outcome, context, and what success looks like."
          value={form.description}
          onChange={update('description')}
          required
        />
        <div className="form-grid-two">
          <Input
            label="Budget (INR)"
            type="number"
            min="0"
            placeholder="75000"
            value={form.budget}
            onChange={update('budget')}
          />
          <Input
            label="Target deadline"
            type="date"
            value={form.deadline}
            onChange={update('deadline')}
          />
        </div>
        <Select label="Experience level" value={form.experienceLevel} onChange={update('experienceLevel')}>
          <option value="ENTRY">Entry</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="EXPERT">Expert</option>
        </Select>
      </div>
      <div className="field" style={{ marginTop: '16px' }}>
        <span>Required skills</span>
        <div className="check-grid">
          {(skills || []).slice(0, 18).map((skill) => (
            <button
              type="button"
              className={`check-pill ${form.skillIds.includes(skill.id) ? 'selected' : ''}`}
              key={skill.id}
              onClick={() => toggleSkill(skill.id)}
            >
              <Check size={13} />
              {skill.name}
            </button>
          ))}
        </div>
      </div>
      <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Publish project'} <ArrowRight size={16} />
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

function CustomerProjectDetail({ projectId }) {
  const { user } = useAuth()
  const validId = Number.isInteger(Number(projectId)) && Number(projectId) > 0 ? Number(projectId) : null
  const state = useFetch(validId ? `/projects/${validId}` : '')
  const proposalState = useFetch(validId ? `/projects/${validId}/proposals` : '')
  const categories = useFetch('/categories')
  const skills = useFetch('/skills')
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState('')
  const [statusBusy, setStatusBusy] = useState(false)

  if (!validId) {
    return (
      <>
        <Link className="back-link" to="/customer/projects">
          <ArrowRight size={15} className="back-arrow" /> Back to My Projects
        </Link>
        <div className="panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <EmptyState
            icon={FolderKanban}
            title="Project not found"
            description="The requested project identifier is invalid or does not exist."
            action={<Link className="button button-primary" to="/customer/projects">Back to My Projects</Link>}
          />
        </div>
      </>
    )
  }

  if (state.loading) return <LoadingInline />

  if (state.error || !state.data) {
    return (
      <>
        <Link className="back-link" to="/customer/projects">
          <ArrowRight size={15} className="back-arrow" /> Back to My Projects
        </Link>
        <div className="panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <EmptyState
            icon={FolderKanban}
            title="Project not found"
            description="We could not find this project in your workspace. It may have been deleted or does not exist."
            action={<Link className="button button-primary" to="/customer/projects">Back to My Projects</Link>}
          />
        </div>
      </>
    )
  }

  const project = state.data
  const proposals = proposalState.data || []

  if (user && user.role !== 'ADMIN' && project.client?.id !== user.id) {
    return (
      <>
        <Link className="back-link" to="/customer/projects">
          <ArrowRight size={15} className="back-arrow" /> Back to My Projects
        </Link>
        <div className="panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <EmptyState
            icon={ShieldCheck}
            title="Access restricted"
            description="You can only manage projects that belong to your customer account."
            action={<Link className="button button-primary" to="/customer/projects">Back to My Projects</Link>}
          />
        </div>
      </>
    )
  }

  const handleStatusChange = async (newStatus) => {
    setStatusBusy(true)
    try {
      await api.patch(`/projects/${validId}`, { status: newStatus })
      setMessage(`Project status updated to ${titleCase(newStatus)}.`)
      state.refetch()
    } catch (err) {
      setMessage(apiError(err))
    } finally {
      setStatusBusy(false)
    }
  }

  return (
    <>
      <Link className="back-link" to="/customer/projects">
        <ArrowRight size={15} className="back-arrow" /> Back to My Projects
      </Link>

      {message && (
        <div className="success-banner" style={{ marginBottom: '20px' }}>
          <Check size={17} />
          <span>{message}</span>
          <button onClick={() => setMessage('')} style={{ marginLeft: 'auto', background: 'transparent', border: 0, cursor: 'pointer' }}><X size={15} /></button>
        </div>
      )}

      {isEditing ? (
        <ProjectForm
          categories={categories.data}
          skills={skills.data}
          initialData={project}
          isEditing={true}
          onDone={(updated, text) => {
            setIsEditing(false)
            setMessage(text)
            state.refetch()
          }}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="detail-layout">
          <div>
            <div className="detail-kicker">
              <span className="category-label">{project.category?.name || 'Customer Project'}</span>
              <StatusBadge value={project.status} />
            </div>
            <h1 className="detail-title">{project.title}</h1>
            <p className="detail-description">{project.description}</p>
            <div className="detail-tags">
              {(project.requiredSkills || []).map(({ skill }) => (
                <span key={skill.id}><Tag size={14} />{skill.name}</span>
              ))}
            </div>
            <div className="detail-meta-grid">
              <div><span>Budget</span><strong>{currency(project.budget)}</strong></div>
              <div><span>Experience</span><strong>{titleCase(project.experienceLevel)}</strong></div>
              <div><span>Deadline</span><strong>{dateLabel(project.deadline)}</strong></div>
              <div><span>Posted</span><strong>{dateLabel(project.createdAt)}</strong></div>
            </div>

            <section className="panel proposal-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-eyebrow">Incoming proposals</span>
                  <h2>{proposals.length} applicant{proposals.length === 1 ? '' : 's'} interested</h2>
                </div>
              </div>

              {proposalState.loading ? (
                <LoadingInline />
              ) : proposals.length ? (
                <div className="proposal-list">
                  {proposals.map((proposal) => (
                    <ProposalRow
                      key={proposal.id}
                      proposal={proposal}
                      customer
                      onDone={(text) => {
                        setMessage(text)
                        proposalState.refetch()
                        state.refetch()
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={BriefcaseBusiness}
                  title="No proposals yet"
                  description="When independent talent discovers your project in Find Work, their proposals will appear here."
                />
              )}
            </section>
          </div>

          <aside className="detail-side">
            <div className="panel-eyebrow" style={{ marginBottom: '12px' }}>Project Management</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Button variant="outline" className="button-full" onClick={() => setIsEditing(true)}>
                Edit project brief
              </Button>

              {project.status === 'OPEN' && (
                <Button
                  variant="outline"
                  className="button-full"
                  disabled={statusBusy}
                  onClick={() => handleStatusChange('CANCELLED')}
                >
                  Close / Cancel project
                </Button>
              )}

              {project.status === 'CANCELLED' && (
                <Button
                  variant="primary"
                  className="button-full"
                  disabled={statusBusy}
                  onClick={() => handleStatusChange('OPEN')}
                >
                  Reopen project
                </Button>
              )}

              {project.status === 'IN_PROGRESS' && (
                <Button
                  variant="primary"
                  className="button-full"
                  disabled={statusBusy}
                  onClick={() => handleStatusChange('COMPLETED')}
                >
                  Mark project completed
                </Button>
              )}
            </div>

            <div className="side-divider" />
            <span className="panel-eyebrow">Project Identifier</span>
            <p style={{ fontSize: '12px', color: 'var(--ink)', fontWeight: 600, marginTop: '6px' }}>
              Canonical Project #{project.id}
            </p>
            <Link
              className="text-link"
              to={`/project/${project.id}`}
              style={{ fontSize: '12px', marginTop: '6px' }}
            >
              View public marketplace preview <ArrowRight size={13} />
            </Link>
          </aside>
        </div>
      )}
    </>
  )
}

function ProjectDetail({ projectId: propId }) {
  const { id: paramId } = useParams()
  const { user } = useAuth()
  const rawId = propId || paramId
  const validId = Number.isInteger(Number(rawId)) && Number(rawId) > 0 ? Number(rawId) : null
  const state = useFetch(validId ? `/projects/${validId}` : '')
  const proposalState = useFetch(validId && user?.role === 'CUSTOMER' ? `/projects/${validId}/proposals` : '')
  const [message, setMessage] = useState('')

  if (!validId) {
    return (
      <>
        <Link className="back-link" to={user ? getHome(user) : '/projects'}>
          <ArrowRight size={15} className="back-arrow" /> Back to marketplace
        </Link>
        <div className="panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <EmptyState
            icon={FolderKanban}
            title="Project not found"
            description="The requested project identifier is invalid or does not exist."
            action={<Link className="button button-primary" to={user ? getHome(user) : '/projects'}>Back to marketplace</Link>}
          />
        </div>
      </>
    )
  }

  if (state.loading) return <LoadingInline />

  if (state.error || !state.data) {
    return (
      <>
        <Link className="back-link" to={user ? getHome(user) : '/projects'}>
          <ArrowRight size={15} className="back-arrow" /> Back to marketplace
        </Link>
        <div className="panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <EmptyState
            icon={FolderKanban}
            title="Project not found"
            description="We could not find this project. It may have been closed or does not exist."
            action={<Link className="button button-primary" to={user ? getHome(user) : '/projects'}>Back to marketplace</Link>}
          />
        </div>
      </>
    )
  }

  const project = state.data
  const proposals = proposalState.data || []
  const isOwner = user && user.id === project.client?.id

  return (
    <>
      <Link className="back-link" to={user ? (user.role === 'FREELANCER' ? '/freelancer/projects' : getHome(user)) : '/projects'}>
        <ArrowRight size={15} className="back-arrow" /> {user?.role === 'FREELANCER' ? 'Back to Find Work' : 'Back to marketplace'}
      </Link>

      {isOwner && (
        <div className="inline-callout" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>You posted this project. Manage applicants, edit brief, or update status in your Customer Workspace.</span>
          <Link className="button button-primary button-small" to={`/customer/projects/${project.id}`}>
            Manage in workspace <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="detail-layout">
        <div>
          <div className="detail-kicker">
            <span className="category-label">{project.category?.name || 'Marketplace project'}</span>
            <StatusBadge value={project.status} />
          </div>
          <h1 className="detail-title">{project.title}</h1>
          <p className="detail-description">{project.description}</p>
          <div className="detail-tags">
            {(project.requiredSkills || []).map(({ skill }) => (
              <span key={skill.id}><Tag size={14} />{skill.name}</span>
            ))}
          </div>
          <div className="detail-meta-grid">
            <div><span>Budget</span><strong>{currency(project.budget)}</strong></div>
            <div><span>Experience</span><strong>{titleCase(project.experienceLevel)}</strong></div>
            <div><span>Deadline</span><strong>{dateLabel(project.deadline)}</strong></div>
            <div><span>Posted</span><strong>{dateLabel(project.createdAt)}</strong></div>
          </div>

          <section className="panel proposal-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-eyebrow">
                  {isOwner ? 'Incoming proposals' : user?.role === 'FREELANCER' ? 'Submit proposal' : 'Platform Opportunity'}
                </span>
                <h2>
                  {isOwner
                    ? `${proposals.length} applicant${proposals.length === 1 ? '' : 's'} interested`
                    : user?.role === 'FREELANCER'
                    ? (project.status === 'OPEN' ? 'Apply for this project' : 'Project status')
                    : 'Project proposals'}
                </h2>
              </div>
            </div>

            {message && <div className="success-banner"><Check size={17} />{message}</div>}

            {user?.role === 'FREELANCER' && project.status === 'OPEN' ? (
              <ProposalForm
                projectId={project.id}
                onDone={(text) => {
                  setMessage(text)
                  state.refetch()
                }}
              />
            ) : user?.role === 'FREELANCER' && project.status !== 'OPEN' ? (
              <div className="inline-callout">
                This project is currently <StatusBadge value={project.status} /> and no longer accepting new proposals.
              </div>
            ) : isOwner && proposals.length ? (
              <div className="proposal-list">
                {proposals.map((proposal) => (
                  <ProposalRow
                    key={proposal.id}
                    proposal={proposal}
                    customer
                    onDone={(text) => {
                      setMessage(text)
                      proposalState.refetch()
                      state.refetch()
                    }}
                  />
                ))}
              </div>
            ) : !user ? (
              <div className="inline-callout">
                Sign in as a freelancer to submit a proposal for this project.{' '}
                <Link to="/login">Sign in <ArrowRight size={14} /></Link>
              </div>
            ) : (
              <EmptyState
                title="No proposals yet"
                description="When proposals are submitted, they will be visible here."
              />
            )}
          </section>
        </div>

        <aside className="detail-side">
          <div className="profile-mini">
            <Avatar name={project.client?.name} />
            <div>
              <strong>{project.client?.name || 'Customer'}</strong>
              <span>Project owner</span>
            </div>
          </div>
          <div className="side-divider" />
          <span className="panel-eyebrow">About this customer</span>
          <p>
            {project.client?.customerProfile?.companyName || 'Independent customer'}
            {project.client?.customerProfile?.location ? ` · ${project.client.customerProfile.location}` : ''}
          </p>
          {user && user.id !== project.client?.id && (
            <Button
              variant="outline"
              className="button-full"
              onClick={async () => {
                try {
                  await api.post('/conversations', { participantId: project.client.id })
                  window.location.assign(`${getHome(user).split('/').slice(0, 2).join('/')}/messages`)
                } catch (err) {
                  setMessage(apiError(err))
                }
              }}
            >
              <MessageSquare size={16} /> Message customer
            </Button>
          )}
        </aside>
      </div>
    </>
  )
}

function ProposalForm({ projectId, onDone }) {
  const [form, setForm] = useState({ proposedPrice: '', estimatedDays: '', coverLetter: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })
  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post(`/projects/${projectId}/proposals`, form)
      onDone('Proposal submitted successfully.')
    } catch (err) {
      setError(apiError(err))
    } finally {
      setSaving(false)
    }
  }
  return (
    <form onSubmit={submit}>
      <div className="form-grid-two">
        <Input label="Your proposed price (INR)" type="number" min="1" value={form.proposedPrice} onChange={update('proposedPrice')} placeholder="85000" required />
        <Input label="Estimated days" type="number" min="1" value={form.estimatedDays} onChange={update('estimatedDays')} placeholder="14" />
      </div>
      <Textarea label="Cover letter" value={form.coverLetter} onChange={update('coverLetter')} placeholder="Tell the customer how you would approach this work." />
      {error && <ErrorState message={error} />}
      <Button disabled={saving}>{saving ? 'Submitting…' : 'Submit proposal'} <ArrowRight size={16} /></Button>
    </form>
  )
}

function ProposalRow({ proposal, customer = false, onDone }) {
  const [busy, setBusy] = useState(false)
  const action = async (status) => {
    setBusy(true)
    try {
      await api.patch(`/proposals/${proposal.id}`, { status })
      onDone(status === 'ACCEPTED' ? 'Proposal accepted. A contract was created.' : status === 'REJECTED' ? 'Proposal rejected.' : 'Proposal withdrawn.')
    } catch (err) {
      onDone(apiError(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="proposal-row">
      <Avatar name={proposal.freelancerProfile?.user?.name} size="sm" />
      <div className="proposal-row-copy">
        <strong>{proposal.freelancerProfile?.user?.name || proposal.project?.title || 'Proposal'}</strong>
        <span>{customer ? `${proposal.freelancerProfile?.user?.professionalTitle || 'Freelancer'} · ${currency(proposal.proposedPrice)}` : `${proposal.project?.title || 'Project'} · ${currency(proposal.proposedPrice)}`}</span>
        {proposal.coverLetter && <p>{proposal.coverLetter}</p>}
      </div>
      <StatusBadge value={proposal.status} />
      {customer && proposal.status === 'PENDING' && (
        <div className="row-actions">
          <button disabled={busy} className="icon-button success-icon" onClick={() => action('ACCEPTED')} title="Accept proposal">
            <Check size={16} />
          </button>
          <button disabled={busy} className="icon-button danger-icon" onClick={() => action('REJECTED')} title="Reject proposal">
            <X size={16} />
          </button>
        </div>
      )}
      {!customer && proposal.status === 'PENDING' && (
        <Button variant="outline" className="button-small" disabled={busy} onClick={() => action('WITHDRAWN')}>
          Withdraw
        </Button>
      )}
    </div>
  )
}

function FreelancersPage() {
  const [values, setValues] = useState({ q: '', skillId: '', sort: '' }); const categories = useFetch('/categories'); const skills = useFetch('/skills'); const state = useFetch('/freelancers', values, [values]);
  return <><PageIntro eyebrow="Independent talent" title="Meet your next collaborator." description="Browse specialized professionals with the skills and context to make meaningful progress." /><Filters kind="freelancers" values={values} setValues={setValues} categories={categories.data} skills={skills.data} />{state.loading ? <LoadingInline /> : state.error ? <ErrorState message={state.error} /> : <><div className="result-summary"><span><strong>{state.data?.pagination?.total ?? 0}</strong> freelancers</span><span className="muted">Independent talent across India</span></div><div className="talent-grid talent-results">{state.data?.items?.length ? state.data.items.map((profile) => <FreelancerCard key={profile.id} profile={profile} />) : <EmptyState icon={Users} title="No profiles match those filters" description="Try a different skill or search term." />}</div></>}</>
}

function FreelancerDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const validId = Number.isInteger(Number(id)) && Number(id) > 0 ? Number(id) : null
  const state = useFetch(validId ? `/freelancers/${validId}` : '')
  const [message, setMessage] = useState('')

  if (!validId) {
    return (
      <>
        <Link className="back-link" to={user ? getHome(user) : '/freelancers'}><ArrowRight size={15} className="back-arrow" /> Back to talent</Link>
        <div className="panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <EmptyState icon={Users} title="Freelancer profile not found" description="The requested talent profile link is invalid or does not exist." action={<Link className="button button-primary" to="/freelancers">Browse available talent</Link>} />
        </div>
      </>
    )
  }

  if (state.loading) return <LoadingInline />
  if (state.error || !state.data) {
    return (
      <>
        <Link className="back-link" to={user ? getHome(user) : '/freelancers'}><ArrowRight size={15} className="back-arrow" /> Back to talent</Link>
        <div className="panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <EmptyState icon={Users} title="Freelancer profile not found" description="We could not locate this talent profile in the active network." action={<Link className="button button-primary" to="/freelancers">Browse available talent</Link>} />
        </div>
      </>
    )
  }

  const profile = state.data
  const reviews = profile.reviews || []
  const startConversation = async () => {
    if (!user) return
    try {
      await api.post('/conversations', { participantId: profile.user.id })
      window.location.assign(`${getHome(user).split('/').slice(0, 2).join('/')}/messages`)
    } catch (err) { setMessage(apiError(err)) }
  }

  return (
    <>
      <Link className="back-link" to={user ? getHome(user) : '/freelancers'}><ArrowRight size={15} className="back-arrow" /> Back to talent</Link>
      <div className="profile-detail">
        <div className="profile-hero">
          <Avatar name={profile.user?.name} size="xl" />
          <div>
            <div className="eyebrow">Independent freelancer</div>
            <h1>{profile.user?.name}</h1>
            <h3>{profile.user?.professionalTitle || 'Independent professional'}</h3>
            <div className="profile-location">{profile.location || 'India'} · {titleCase(profile.availability)}</div>
          </div>
          <div className="profile-actions">
            <Button onClick={startConversation}><MessageSquare size={16} /> Start a conversation</Button>
            {message && <span className="muted">{message}</span>}
          </div>
        </div>
        <div className="profile-detail-grid">
          <main>
            <section className="panel">
              <div className="panel-heading"><div><span className="panel-eyebrow">About</span><h2>A little more context</h2></div></div>
              <p className="rich-copy">{profile.bio || 'This freelancer has not added a bio yet.'}</p>
            </section>
            <section className="panel">
              <div className="panel-heading"><div><span className="panel-eyebrow">Selected work</span><h2>Portfolio</h2></div></div>
              <div className="portfolio-grid">
                {profile.portfolioProjects?.length ? profile.portfolioProjects.map((item) => (
                  <div className="portfolio-card" key={item.id}>
                    <div className="portfolio-thumb"><Sparkles size={20} /></div>
                    <strong>{item.title}</strong>
                    <p>{item.description || 'A selected portfolio project.'}</p>
                    {item.projectUrl && <a href={item.projectUrl} target="_blank" rel="noreferrer">View project <ArrowRight size={14} /></a>}
                  </div>
                )) : <EmptyState icon={Sparkles} title="Portfolio coming together" description="This freelancer has not published portfolio items yet." />}
              </div>
            </section>
          </main>
          <aside>
            <div className="panel profile-facts">
              <div><span>Hourly rate</span><strong>{currency(profile.hourlyRate)}<small> / hour</small></strong></div>
              <div><span>Experience</span><strong>{titleCase(profile.experienceLevel)}</strong></div>
              <div><span>Projects applied to</span><strong>{profile._count?.proposals ?? 0}</strong></div>
            </div>
            <div className="panel">
              <div className="panel-heading"><div><span className="panel-eyebrow">Capabilities</span><h2>Skills</h2></div></div>
              <div className="detail-tags">
                {(profile.skills || []).length ? (profile.skills || []).map(({ skill }) => (
                  <span key={skill.id}><Tag size={14} />{skill.name}</span>
                )) : <span className="muted">No skills tagged yet.</span>}
              </div>
            </div>
            <div className="panel">
              <div className="panel-heading"><div><span className="panel-eyebrow">Trust signal</span><h2>Reviews</h2></div><Star size={17} className="panel-star" /></div>
              {reviews.length ? reviews.slice(0, 3).map((review) => (
                <div className="review-mini" key={review.id}>
                  <div className="stars">{'★'.repeat(review.rating)}<span>{'★'.repeat(5 - review.rating)}</span></div>
                  <p>{review.comment || 'No comment added.'}</p>
                  <small>{review.reviewer?.name}</small>
                </div>
              )) : <p className="muted">No reviews yet.</p>}
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

function DataPage({ kind, endpoint, title, description, renderItem, emptyTitle, emptyDescription }) {
  const state = useFetch(endpoint)
  return <><PageIntro eyebrow="Customer workspace" title={title} description={description} />{state.loading ? <LoadingInline /> : state.error ? <ErrorState message={state.error} /> : state.data?.length ? <div className="panel data-list">{state.data.map((item) => <div className="data-row" key={item.id}>{renderItem(item)}</div>)}</div> : <EmptyState icon={kind === 'payments' ? CircleDollarSign : kind === 'contracts' ? ShieldCheck : kind === 'reviews' ? Star : FlagIcon} title={emptyTitle} description={emptyDescription} />}</>
}

function ProposalsPage() {
  const { user } = useAuth()
  return <DataPage kind="proposals" endpoint="/proposals/mine" title="Proposals for your projects." description="Review incoming freelancer proposals and decide which relationships to move forward." emptyTitle="No proposals yet" emptyDescription="Proposals received on your open projects will appear here." renderItem={(proposal) => <><Avatar name={proposal.freelancerProfile?.user?.name} size="sm" /><div className="data-row-copy"><strong>{proposal.freelancerProfile?.user?.name || 'Freelancer'}</strong><span>{proposal.project?.title || 'Project'} · {currency(proposal.proposedPrice)}{proposal.estimatedDays ? ` · ${proposal.estimatedDays} days` : ''}</span><small>{proposal.coverLetter || 'No cover letter provided.'}</small></div><StatusBadge value={proposal.status} /><Link className="button button-outline button-small" to={user?.role === 'CUSTOMER' ? `/customer/projects/${proposal.projectId}` : `/project/${proposal.projectId}`}>View</Link></>}/>
}

function ContractsPage() {
  const { user } = useAuth()
  return <DataPage kind="contracts" endpoint="/contracts/mine" title="Contracts and engagements." description="Keep agreed scope, counterparties, and delivery status in one clear view." emptyTitle="No contracts yet" emptyDescription="Accepted proposals will create contracts that appear here." renderItem={(contract) => <><Avatar name={contract.freelancer?.name} size="sm" /><div className="data-row-copy"><strong>{contract.project?.title || 'Contract'}</strong><span>{contract.freelancer?.name || 'Freelancer'} · {currency(contract.agreedAmount)}</span><small>{dateLabel(contract.startDate)}{contract.endDate ? ` — ${dateLabel(contract.endDate)}` : ''}</small></div><StatusBadge value={contract.status} /><Link className="button button-outline button-small" to={user?.role === 'CUSTOMER' ? `/customer/projects/${contract.projectId}` : `/project/${contract.projectId}`}>Open</Link></>}/>
}

function MessagesPage() {
  const { user } = useAuth()
  const state = useFetch('/conversations')
  return <><PageIntro eyebrow="Shared communication" title="Keep every conversation moving." description="Your existing FreelanceHub conversations are shown here with role-safe access." />{state.loading ? <LoadingInline /> : state.error ? <ErrorState message={state.error} /> : state.data?.length ? <div className="panel data-list">{state.data.map((conversation) => { const other = conversation.participants?.find((participant) => participant.userId !== user?.id)?.user; return <div className="data-row" key={conversation.id}><Avatar name={other?.name} size="sm" /><div className="data-row-copy"><strong>{other?.name || 'Conversation'}</strong><span>{conversation.messages?.[0]?.content || 'No messages yet.'}</span><small>{dateLabel(conversation.updatedAt)}</small></div><Link className="button button-primary button-small" to={`?conversation=${conversation.id}`}>Open</Link></div> })}</div> : <EmptyState icon={MessageSquare} title="No conversations yet" description="Start a conversation from a freelancer or project profile." />}</>
}

function PaymentsPage() {
  const { user } = useAuth()
  const state = useFetch('/payments/mine')
  const total = (state.data || []).filter((payment) => payment.payerId === user?.id && payment.status === 'COMPLETED').reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  return <><PageIntro eyebrow="Financial activity" title="Payments and transaction history." description="Review recorded payment activity. Payment processing is not represented until a real payment record exists." /><div className="stats-grid"><StatCard icon={CircleDollarSign} label="Total spent" value={currency(total)} helper="Completed recorded payments" tone="amber" /><StatCard icon={Check} label="Transactions" value={state.data?.length ?? '—'} helper="All visible payment records" /></div>{state.loading ? <LoadingInline /> : state.error ? <ErrorState message={state.error} /> : state.data?.length ? <div className="panel data-list">{state.data.map((payment) => <div className="data-row" key={payment.id}><div className="activity-avatar"><CircleDollarSign size={17} /></div><div className="data-row-copy"><strong>{payment.contract?.project?.title || 'Contract payment'}</strong><span>{payment.receiver?.name || 'Freelancer'} · {currency(payment.amount)}</span><small>{dateLabel(payment.createdAt)}</small></div><StatusBadge value={payment.status} /></div>)}</div> : <EmptyState icon={CircleDollarSign} title="No payments yet" description="Your payment history will appear here once recorded transactions exist." />}</>
}

function ReviewsPage() {
  return <DataPage kind="reviews" endpoint="/reviews/mine" title="Reviews and trust signals." description="See feedback you have given and received on completed engagements." emptyTitle="No reviews yet" emptyDescription="Reviews will appear after a completed contract has a recorded review." renderItem={(review) => <><div className="activity-avatar"><Star size={17} /></div><div className="data-row-copy"><strong>{review.project?.title || 'Project review'}</strong><span>{review.reviewedUser?.name || 'Freelancer'} · {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span><small>{review.comment || 'No written comment.'} · {dateLabel(review.createdAt)}</small></div></>}/>
}

function ReportsPage() {
  return <DataPage kind="reports" endpoint="/reports/mine" title="Reports and resolutions." description="Track reports you have submitted and the current moderation status." emptyTitle="No reports submitted" emptyDescription="Submitted reports and their resolution details will appear here." renderItem={(report) => <><div className="activity-avatar"><Flag size={17} /></div><div className="data-row-copy"><strong>{report.reason}</strong><span>Reported user: {report.reportedUser?.name || 'Unavailable'}</span><small>{report.description || 'No additional details.'} · {dateLabel(report.createdAt)}</small></div><StatusBadge value={report.status} /></>}/>
}

function AdminReportsPage() { return <DataPage kind="reports" endpoint="/admin/reports" title="Moderation queue." description="Review platform reports using the existing admin workflow." emptyTitle="No reports in the queue" emptyDescription="The moderation queue is clear." renderItem={(report) => <><div className="data-row-copy"><strong>{report.reason}</strong><span>{report.reporter?.name} reported {report.reportedUser?.name}</span></div><StatusBadge value={report.status} /></>} /> }
function AdminUsersPage() { return <DataPage endpoint="/admin/stats" title="User operations." description="Platform user statistics are available from the admin workspace." emptyTitle="No user statistics" emptyDescription="Statistics are not currently available." renderItem={(item) => <span>{JSON.stringify(item)}</span>} /> }
function AdminProjectsPage() { return <ProjectsPage /> }
function AdminCatalogPage() { return <DataPage endpoint="/categories" title="Marketplace catalog." description="Categories currently available to the marketplace." emptyTitle="No categories" emptyDescription="No categories are currently configured." renderItem={(item) => <><div className="data-row-copy"><strong>{item.name}</strong><span>{item._count?.projects ?? 0} projects</span></div></>} /> }

function CustomerProfilePage() {
  const { user, refresh } = useAuth(); const state = useFetch('/profile'); const [form, setForm] = useState(null); const [message, setMessage] = useState(''); const [error, setError] = useState('')
  useEffect(() => { if (!state.loading) { const profile = state.data || {}; setForm({ name: profile.user?.name || user?.name || '', bio: profile.bio || '', companyName: profile.companyName || '', location: profile.location || '' }) } }, [state.loading, state.data, user])
  if (state.loading || !form) return <LoadingInline />
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })
  const save = async (event) => { event.preventDefault(); setError(''); setMessage(''); try { await api.patch('/profile', form); await refresh(); setMessage('Profile updated successfully.') } catch (err) { setError(apiError(err)) } }
  const completion = [form.name, form.bio, form.companyName, form.location].filter(Boolean).length * 25
  return <><PageIntro eyebrow="Customer identity" title="Make your customer profile clear." description="Use your real account and CustomerProfile data to help freelancers understand who they will work with." />{message && <div className="success-banner"><Check size={17} />{message}</div>}{error && <ErrorState message={error} />}<div className="two-column"><form className="panel form-panel" onSubmit={save}><div className="panel-heading"><div><span className="panel-eyebrow">Profile completion</span><h2>{completion}% complete</h2></div><span className="required-note">{completion === 100 ? 'All available details are filled' : 'Add context to build trust'}</span></div><div className="progress" style={{ marginBottom: '22px' }}><span style={{ width: `${completion}%` }} /></div><Input label="Full name" value={form.name} onChange={update('name')} required /><Input label="Company or business name" value={form.companyName} onChange={update('companyName')} placeholder="Optional" /><Textarea label="About you or your business" value={form.bio} onChange={update('bio')} placeholder="Share your goals, context, and what you value in a freelancer." /><Input label="Location" value={form.location} onChange={update('location')} placeholder="City, country" /><div className="form-actions"><Button>Save profile <Check size={16} /></Button></div></form><section className="panel"><div className="panel-heading"><div><span className="panel-eyebrow">Account information</span><h2>{form.name}</h2></div><Avatar name={form.name} size="sm" /></div><div className="profile-facts"><div><span>Email</span><strong>{user?.email}</strong></div><div><span>Role</span><strong>{roleLabel[user?.role]}</strong></div><div><span>Company</span><strong>{form.companyName || 'Not added'}</strong></div><div><span>Location</span><strong>{form.location || 'Not added'}</strong></div></div></section></div></>
}

function ProfilePage() {
  const { user, refresh } = useAuth()
  if (user?.role === 'CUSTOMER') return <CustomerProfilePage />
  const state = useFetch('/profile')
  const skills = useFetch('/skills')
  const [form, setForm] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!state.loading) {
      const profile = state.data || {}
      setForm({
        name: profile.user?.name || user?.name || '',
        professionalTitle: profile.user?.professionalTitle || user?.professionalTitle || '',
        bio: profile.bio || '',
        hourlyRate: profile.hourlyRate || '',
        experienceLevel: profile.experienceLevel || 'INTERMEDIATE',
        location: profile.location || '',
        availability: profile.availability || 'FULL_TIME',
        skillIds: (profile.skills || []).map(({ skill }) => skill.id)
      })
    }
  }, [state.loading, state.data, user])

  if (state.loading || !form) return <LoadingInline />
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })
  const toggleSkill = (id) => setForm({ ...form, skillIds: form.skillIds.includes(id) ? form.skillIds.filter((item) => item !== id) : [...form.skillIds, id] })
  const save = async (event) => {
    event.preventDefault(); setError(''); setMessage('')
    try { await api.patch('/profile', form); await refresh(); setMessage('Profile updated successfully.') }
    catch (err) { setError(apiError(err)) }
  }
  const hasBio = Boolean(form.bio.trim())
  const hasSkills = form.skillIds.length > 0
  const hasPortfolio = Boolean(state.data?.portfolioProjects?.length)
  const completion = 25 + (hasBio ? 25 : 0) + (hasSkills ? 25 : 0) + (hasPortfolio ? 25 : 0)
  const missing = !hasBio ? 'Add your professional bio' : !hasSkills ? 'Add skills to improve discoverability' : !hasPortfolio ? 'Add a portfolio project' : 'Your profile is complete'

  return <><PageIntro eyebrow="Professional identity" title="Make your profile work harder." description="Give clients the context they need to understand your expertise and choose you with confidence." />{message && <div className="success-banner"><Check size={17} />{message}</div>}{error && <ErrorState message={error} />}<div className="two-column"><form className="panel form-panel" onSubmit={save}><div className="panel-heading"><div><span className="panel-eyebrow">Profile completion</span><h2>{completion}% complete</h2></div><span className="required-note">{missing}</span></div><div className="progress" style={{ marginBottom: '22px' }}><span style={{ width: `${completion}%` }} /></div><Input label="Full name" value={form.name} onChange={update('name')} required /><Input label="Professional title" value={form.professionalTitle} onChange={update('professionalTitle')} required /><Textarea label="Professional bio" value={form.bio} onChange={update('bio')} placeholder="Describe your strengths, experience, and the problems you solve." /><div className="form-grid-two"><Select label="Experience level" value={form.experienceLevel} onChange={update('experienceLevel')}><option value="ENTRY">Entry</option><option value="INTERMEDIATE">Intermediate</option><option value="EXPERT">Expert</option></Select><Input label="Hourly rate (INR)" type="number" min="0" value={form.hourlyRate} onChange={update('hourlyRate')} placeholder="2500" /></div><div className="form-grid-two"><Select label="Availability" value={form.availability} onChange={update('availability')}><option value="FULL_TIME">Full time</option><option value="PART_TIME">Part time</option><option value="NOT_AVAILABLE">Not available</option></Select><Input label="Location" value={form.location} onChange={update('location')} placeholder="Bengaluru, India" /></div><div className="field"><span>Skills from the live database</span><div className="check-grid">{(skills.data || []).map((skill) => <button type="button" className={`check-pill ${form.skillIds.includes(skill.id) ? 'selected' : ''}`} key={skill.id} onClick={() => toggleSkill(skill.id)}><Check size={13} />{skill.name}</button>)}</div></div><div className="form-actions"><Button>Save profile <Check size={16} /></Button></div></form><section className="panel"><div className="panel-heading"><div><span className="panel-eyebrow">Profile signal</span><h2>What clients will see</h2></div><Avatar name={form.name} size="sm" /></div><div className="profile-facts"><div><span>Professional title</span><strong>{form.professionalTitle || 'Add a title'}</strong></div><div><span>Experience</span><strong>{titleCase(form.experienceLevel)}</strong></div><div><span>Availability</span><strong>{titleCase(form.availability)}</strong></div><div><span>Portfolio</span><strong>{hasPortfolio ? `${state.data.portfolioProjects.length} project(s)` : 'Add your first project'}</strong></div></div><Link className="button button-outline button-full" to={`/freelancer/${state.data?.id || ''}`} style={{ marginTop: '20px' }}>Preview public profile <ArrowRight size={15} /></Link></section></div></>
}

function PortfolioPage() {
  const state = useFetch('/portfolio')
  const skills = useFetch('/skills')
  const [form, setForm] = useState({ title: '', description: '', projectUrl: '', skillIds: [] })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const submit = async (event) => { event.preventDefault(); setError(''); try { await api.post('/portfolio', form); setMessage('Portfolio project added.'); setForm({ title: '', description: '', projectUrl: '', skillIds: [] }); window.location.reload() } catch (err) { setError(apiError(err)) } }
  const remove = async (id) => { if (!window.confirm('Delete this portfolio project?')) return; try { await api.delete(`/portfolio/${id}`); window.location.reload() } catch (err) { setError(apiError(err)) } }
  return <><PageIntro eyebrow="Proof of work" title="Show clients what you can do." description="Publish real work from your career. Portfolio changes are saved to your FreelancerProfile relationships." />{message && <div className="success-banner"><Check size={17} />{message}</div>}{error && <ErrorState message={error} />}<div className="two-column"><form className="panel form-panel" onSubmit={submit}><div className="panel-heading"><div><span className="panel-eyebrow">New portfolio project</span><h2>Add a strong example.</h2></div></div><Input label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Fintech onboarding redesign" required /><Textarea label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What did you make, and what changed because of it?" /><Input label="Project URL" type="url" value={form.projectUrl} onChange={(event) => setForm({ ...form, projectUrl: event.target.value })} placeholder="https://…" /><div className="field"><span>Skills used</span><div className="check-grid">{(skills.data || []).map((skill) => <button type="button" className={`check-pill ${form.skillIds.includes(skill.id) ? 'selected' : ''}`} key={skill.id} onClick={() => setForm({ ...form, skillIds: form.skillIds.includes(skill.id) ? form.skillIds.filter((id) => id !== skill.id) : [...form.skillIds, skill.id] })}><Check size={13} />{skill.name}</button>)}</div></div><Button>Add portfolio project <Plus size={16} /></Button></form><section className="panel"><div className="panel-heading"><div><span className="panel-eyebrow">Published work</span><h2>Your portfolio</h2></div></div>{state.loading ? <LoadingInline /> : state.error ? <ErrorState message={state.error} /> : state.data?.length ? <div className="portfolio-list">{state.data.map((item) => <div className="portfolio-list-item" key={item.id}><div className="portfolio-thumb"><Sparkles size={20} /></div><div style={{ flex: 1 }}><strong>{item.title}</strong><p>{item.description || 'No description added.'}</p><div className="tag-row">{(item.skills || []).map(({ skill }) => <span key={skill.id}>{skill.name}</span>)}</div></div><button className="icon-button danger-icon" onClick={() => remove(item.id)}><X size={16} /></button></div>)}</div> : <EmptyState icon={Sparkles} title="No portfolio projects yet" description="Show clients what you can do — add your first portfolio project." />}</section></div></>
}

function SettingsPage() {
  const { user, logout } = useAuth()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const submitPassword = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match')
      return
    }
    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    setSaving(true)
    try {
      const response = await api.patch('/auth/change-password', form)
      setMessage(response.data?.message || 'Password changed successfully.')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(apiError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageIntro
        eyebrow="Account & Security"
        title="Settings and security."
        description="Manage your account credentials, security preferences, and workspace session."
      />
      {message && <div className="success-banner"><Check size={17} />{message}</div>}
      {error && <ErrorState message={error} />}
      <div className="two-column">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="panel-eyebrow">Account information</span>
              <h2>Your credentials</h2>
            </div>
          </div>
          <div className="profile-facts" style={{ gridTemplateColumns: '1fr', gap: '14px' }}>
            <div><span>Full Name</span><strong>{user?.name}</strong></div>
            <div><span>Email Address</span><strong>{user?.email}</strong></div>
            <div><span>Role</span><strong>{roleLabel[user?.role]}</strong></div>
            {user?.professionalTitle && <div><span>Professional Title</span><strong>{user.professionalTitle}</strong></div>}
            <div><span>Account Status</span><StatusBadge value={user?.status || 'ACTIVE'} /></div>
          </div>
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--line)' }}>
            <span className="panel-eyebrow" style={{ display: 'block', marginBottom: '8px' }}>Active Session</span>
            <p className="panel-copy" style={{ marginBottom: '14px' }}>Signed in securely with JWT token authentication.</p>
            <Button variant="outline" className="button-small" onClick={logout}><LogOut size={15} /> Sign out from workspace</Button>
          </div>
        </section>

        <form className="panel form-panel" onSubmit={submitPassword}>
          <div className="panel-heading">
            <div>
              <span className="panel-eyebrow">Security</span>
              <h2>Change password</h2>
            </div>
          </div>
          <Input
            label="Current password"
            type="password"
            value={form.currentPassword}
            onChange={update('currentPassword')}
            placeholder="Enter your current password"
            required
          />
          <Input
            label="New password"
            type="password"
            value={form.newPassword}
            onChange={update('newPassword')}
            placeholder="At least 6 characters"
            minLength={6}
            required
          />
          <Input
            label="Confirm new password"
            type="password"
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            placeholder="Repeat new password"
            minLength={6}
            required
          />
          <div className="form-actions">
            <Button disabled={saving}>
              {saving ? 'Updating…' : 'Update password'} <Check size={16} />
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}

function RouteView({ path }) {
  const { user } = useAuth()
  const prefix = `/${user?.role?.toLowerCase()}`
  if (path === `${prefix}/dashboard`) return <DashboardPage />

  // Customer project detail
  const customerProjectMatch = path.match(/^\/customer\/projects\/([^/]+)$/)
  if (customerProjectMatch) {
    return <CustomerProjectDetail projectId={customerProjectMatch[1]} />
  }

  // Customer projects list
  if (path === '/customer/projects') return <ProjectsPage mine />
  if (path === '/customer/freelancers') return <FreelancersPage />

  // Freelancer project detail
  const freelancerProjectMatch = path.match(/^\/freelancer\/projects\/([^/]+)$/)
  if (freelancerProjectMatch && user?.role === 'FREELANCER') {
    return <ProjectDetail projectId={freelancerProjectMatch[1]} />
  }

  if (path.endsWith('/projects') && user?.role === 'FREELANCER') return <ProjectsPage />
  if (path.endsWith('/proposals')) return <ProposalsPage />
  if (path.endsWith('/contracts')) return <ContractsPage />
  if (path.endsWith('/messages')) return <MessagesPage />
  if (path.endsWith('/payments')) return <PaymentsPage />
  if (path.endsWith('/reviews')) return <ReviewsPage />
  if (path.endsWith('/reports')) return user?.role === 'ADMIN' ? <AdminReportsPage /> : <ReportsPage />
  if (path.endsWith('/portfolio')) return <PortfolioPage />
  if (path.endsWith('/profile')) return <ProfilePage />
  if (path.endsWith('/settings')) return <SettingsPage />
  if (path === '/admin/users') return <AdminUsersPage />
  if (path === '/admin/projects') return <AdminProjectsPage />
  if (path === '/admin/catalog') return <AdminCatalogPage />
  return <DashboardPage />
}


function WorkspaceRoute() { const location = useLocation(); return <AppShell><RouteView path={location.pathname} /></AppShell> }

function App() {
  return <BrowserRouter><AuthProvider><Routes><Route path="/" element={<LandingPage />} /><Route path="/login" element={<AuthPage />} /><Route path="/register/customer" element={<AuthPage registerRole="CUSTOMER" />} /><Route path="/register/freelancer" element={<AuthPage registerRole="FREELANCER" />} /><Route path="/projects" element={<PublicPage><ProjectsPage /></PublicPage>} /><Route path="/freelancers" element={<PublicPage><FreelancersPage /></PublicPage>} /><Route path="/project/:id" element={<PublicPage><ProjectDetail /></PublicPage>} /><Route path="/freelancer/:id" element={<PublicPage><FreelancerDetail /></PublicPage>} /><Route path="/customer/*" element={<ProtectedRoute roles={['CUSTOMER']}><WorkspaceRoute /></ProtectedRoute>} /><Route path="/freelancer/*" element={<ProtectedRoute roles={['FREELANCER']}><WorkspaceRoute /></ProtectedRoute>} /><Route path="/admin/*" element={<ProtectedRoute roles={['ADMIN']}><WorkspaceRoute /></ProtectedRoute>} /><Route path="*" element={<RootRedirect />} /></Routes></AuthProvider></BrowserRouter>
}
function PublicPage({ children }) { return <div className="public-page workspace-public"><PublicNav /><main className="public-main">{children}</main></div> }
function RootRedirect() { const { user } = useAuth(); return <Navigate to={user ? getHome(user) : '/'} replace /> }
export default App
