import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Globe, MapPin, Check, ArrowRight, Sparkles,
  ShieldCheck, CheckCircle2, AlertCircle, Briefcase, Users
} from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/ui/Button'

const ORG_TYPES = [
  { id: 'Individual / Personal', label: 'Individual / Personal', desc: 'Hiring as a solo founder, researcher, or creator' },
  { id: 'Startup', label: 'Startup', desc: 'Fast-growing venture building MVP or scaling product' },
  { id: 'Small Business', label: 'Small Business', desc: 'Local or online business seeking specialized expertise' },
  { id: 'Established Business', label: 'Established Enterprise', desc: 'Company with established teams and operations' },
  { id: 'Agency', label: 'Digital / Creative Agency', desc: 'Agency hiring specialized talent for client projects' },
  { id: 'Other', label: 'Other', desc: 'Non-profit, community, or educational organization' }
]

const USE_CASES = [
  'Building a website',
  'Software & app development',
  'Design, UX & branding',
  'Marketing & SEO growth',
  'Business operations & data analytics',
  'Other / Ongoing freelance support'
]

export default function CustomerProfileSetup({ user, refreshUser }) {
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name || '')
  const [organizationType, setOrganizationType] = useState('Startup')
  const [useCase, setUseCase] = useState('Building a website')
  const [companyName, setCompanyName] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [location, setLocation] = useState('')
  const [profileImage, setProfileImage] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Pre-populate if existing customer profile data exists
    api.get('/profile').then((res) => {
      const p = res.data?.data || res.data || {}
      if (p.companyName) setCompanyName(p.companyName)
      if (p.bio) setBio(p.bio)
      if (p.organizationType) setOrganizationType(p.organizationType)
      if (p.useCase) setUseCase(p.useCase)
      if (p.website) setWebsite(p.website)
      if (p.linkedinUrl) setLinkedinUrl(p.linkedinUrl)
      if (p.location) setLocation(p.location)
      if (p.profileImage) setProfileImage(p.profileImage)
    }).catch(() => {})
  }, [])

  // Completion calculation
  const isPersonal = organizationType === 'Individual / Personal'
  const hasType = Boolean(organizationType)
  const hasUseCase = Boolean(useCase)
  const hasCompany = isPersonal || Boolean(companyName.trim())
  const hasBio = Boolean(bio.trim())
  const hasPresence = Boolean(website.trim() || linkedinUrl.trim())
  const hasLocation = Boolean(location.trim())

  const itemsDone = [hasType, hasUseCase, hasCompany, hasBio, hasPresence, hasLocation].filter(Boolean).length
  const completionPercentage = Math.round((itemsDone / 6) * 100)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please provide your name.')
      return
    }
    if (!isPersonal && !companyName.trim()) {
      setError('Please provide your business or organization name.')
      return
    }

    setSaving(true)
    try {
      await api.patch('/profile', {
        name: name.trim(),
        companyName: companyName.trim() || null,
        organizationType,
        useCase,
        bio: bio.trim() || null,
        website: website.trim() || null,
        linkedinUrl: linkedinUrl.trim() || null,
        location: location.trim() || null,
        profileImage: profileImage.trim() || null,
        isProfileCompleted: true
      })

      if (refreshUser) await refreshUser()
      navigate('/customer/dashboard', { replace: true })
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.message || 'Could not complete customer profile setup. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: '980px', margin: '30px auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--blue-soft)', color: 'var(--blue)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
          <Sparkles size={14} /> Step 2 of 2 · Client Verification & Setup
        </div>
        <h1 style={{ fontSize: '30px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.03em' }}>
          Set up your customer organization
        </h1>
        <p className="muted" style={{ fontSize: '15px', maxWidth: '580px', margin: '0 auto' }}>
          Introduce your business and hiring goals. Top Indian freelancers use this verified information to understand your project scope and submit tailored proposals.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '28px', alignItems: 'start' }}>
        {/* Main Form */}
        <form onSubmit={handleSubmit} className="panel form-panel" style={{ background: 'white', borderRadius: '12px', padding: '28px' }}>
          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Question 1: What best describes you? */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ fontSize: '15px', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
              1. What best describes your organization? <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <span className="muted" style={{ fontSize: '12px', display: 'block', marginBottom: '12px' }}>
              Helps match you with freelancers suited for your company tier.
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {ORG_TYPES.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setOrganizationType(type.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: organizationType === type.id ? '2px solid var(--blue)' : '1px solid var(--line)',
                    background: organizationType === type.id ? 'var(--blue-soft)' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <strong style={{ fontSize: '13px', color: organizationType === type.id ? 'var(--blue-dark)' : 'var(--ink)', display: 'block', marginBottom: '2px' }}>
                    {type.label}
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.3, display: 'block' }}>
                    {type.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Question 2: Primary Purpose / Use Case */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ fontSize: '15px', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
              2. What are you primarily looking to build or achieve? <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <span className="muted" style={{ fontSize: '12px', display: 'block', marginBottom: '12px' }}>
              Select the core requirement you plan to post projects for.
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '8px' }}>
              {USE_CASES.map((uc) => (
                <button
                  type="button"
                  key={uc}
                  onClick={() => setUseCase(uc)}
                  className={`check-pill ${useCase === uc ? 'selected' : ''}`}
                  style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '13px' }}
                >
                  <Check size={14} /> {uc}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Public / Business Information */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ fontSize: '15px', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
              3. Public Business & Project Information
            </label>
            <span className="muted" style={{ fontSize: '12px', display: 'block', marginBottom: '16px' }}>
              Legitimate company details encourage expert talent to prioritize your project postings.
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div className="field">
                <label>Your Name / Contact Person <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Iyer"
                  required
                />
              </div>

              <div className="field">
                <label>Company / Organization Name{!isPersonal && <span style={{ color: '#ef4444' }}> *</span>}</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Tech Innovations"
                  required={!isPersonal}
                />
              </div>
            </div>

            <div className="field" style={{ marginBottom: '14px' }}>
              <label>About You or Your Organization</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your business mission, current product roadmap, and what you value when working with freelancers."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div className="field">
                <label>Company Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://company.in"
                />
              </div>

              <div className="field">
                <label>Company LinkedIn Profile</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="field">
                <label>Office / Operation Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mumbai, Maharashtra"
                />
              </div>

              <div className="field">
                <label>Public Logo / Photo URL</label>
                <input
                  type="url"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  placeholder="https://... logo link"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
            <span className="muted" style={{ fontSize: '12px' }}>
              Can be updated anytime from your customer profile.
            </span>
            <Button disabled={saving} aria-busy={saving} className="button-primary">
              {saving ? 'Completing Setup…' : 'Complete Setup & Enter Dashboard'} <ArrowRight size={16} />
            </Button>
          </div>
        </form>

        {/* Sidebar: Profile Summary & Trust Signal */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px' }}>
          <div className="panel" style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <span className="panel-eyebrow">Customer Trust Signal</span>
              <strong style={{ fontSize: '18px', color: 'var(--blue)' }}>{completionPercentage}%</strong>
            </div>

            <div className="progress" style={{ marginBottom: '16px', height: '8px' }}>
              <span style={{ width: `${completionPercentage}%`, transition: 'width 0.3s ease' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasType ? '#16a34a' : 'var(--muted)' }}>
                {hasType ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
                <span style={{ fontWeight: hasType ? 700 : 500 }}>Organization Category</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasUseCase ? '#16a34a' : 'var(--muted)' }}>
                {hasUseCase ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
                <span style={{ fontWeight: hasUseCase ? 700 : 500 }}>Primary Goal / Purpose</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasCompany ? '#16a34a' : 'var(--muted)' }}>
                {hasCompany ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
                <span style={{ fontWeight: hasCompany ? 700 : 500 }}>Business Name{isPersonal ? ' (optional for individuals)' : ''}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasBio ? '#16a34a' : 'var(--muted)' }}>
                {hasBio ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
                <span style={{ fontWeight: hasBio ? 700 : 500 }}>About & Description</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasPresence ? '#16a34a' : 'var(--muted)' }}>
                {hasPresence ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
                <span style={{ fontWeight: hasPresence ? 700 : 500 }}>Website / LinkedIn</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasLocation ? '#16a34a' : 'var(--muted)' }}>
                {hasLocation ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
                <span style={{ fontWeight: hasLocation ? 700 : 500 }}>Location</span>
              </div>
            </div>
          </div>

          <div className="panel" style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', fontSize: '12px', color: 'var(--muted)' }}>
            <Building2 size={18} style={{ color: 'var(--blue)', marginBottom: '8px' }} />
            <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>Verified Client Badge</strong>
            Customers with verified business information and clear organization descriptions attract top-tier expert proposals within 2 hours of posting.
          </div>
        </aside>
      </div>
    </div>
  )
}
