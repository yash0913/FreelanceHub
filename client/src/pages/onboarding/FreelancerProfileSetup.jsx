import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  BriefcaseBusiness, Check, ArrowRight, User, Globe, Award, Sparkles,
  Plus, Trash2, ShieldCheck, CheckCircle2, ChevronRight, AlertCircle
} from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/ui/Button'

export default function FreelancerProfileSetup({ user, refreshUser }) {
  const navigate = useNavigate()
  const [skillsList, setSkillsList] = useState([])
  const [loadingSkills, setLoadingSkills] = useState(true)

  // Step / Form state
  const [name, setName] = useState(user?.name || '')
  const [professionalTitle, setProfessionalTitle] = useState(user?.professionalTitle || '')
  const [profileImage, setProfileImage] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [availability, setAvailability] = useState('FULL_TIME')
  const [experienceLevel, setExperienceLevel] = useState('INTERMEDIATE')

  // Professional Presence
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')

  // Experience & Skills
  const [yearsOfExperience, setYearsOfExperience] = useState('')
  const [experienceSummary, setExperienceSummary] = useState('')
  const [selectedSkillIds, setSelectedSkillIds] = useState([])

  // Certifications
  const [certifications, setCertifications] = useState([])
  const [certName, setCertName] = useState('')
  const [certOrg, setCertOrg] = useState('')
  const [certYear, setCertYear] = useState('')
  const [certUrl, setCertUrl] = useState('')

  // First Portfolio Project (optional during setup)
  const [portfolioTitle, setPortfolioTitle] = useState('')
  const [portfolioDesc, setPortfolioDesc] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Fetch live skills from database
    api.get('/skills').then((res) => {
      const list = res.data?.data || res.data || []
      setSkillsList(list)
    }).catch(console.error).finally(() => setLoadingSkills(false))

    // Pre-populate if existing profile data is present
    api.get('/profile').then((res) => {
      const p = res.data?.data || res.data || {}
      if (p.bio) setBio(p.bio)
      if (p.location) setLocation(p.location)
      if (p.hourlyRate) setHourlyRate(p.hourlyRate)
      if (p.availability) setAvailability(p.availability)
      if (p.experienceLevel) setExperienceLevel(p.experienceLevel)
      if (p.profileImage) setProfileImage(p.profileImage)
      if (p.linkedinUrl) setLinkedinUrl(p.linkedinUrl)
      if (p.githubUrl) setGithubUrl(p.githubUrl)
      if (p.websiteUrl) setWebsiteUrl(p.websiteUrl)
      if (p.yearsOfExperience) setYearsOfExperience(p.yearsOfExperience)
      if (p.experienceSummary) setExperienceSummary(p.experienceSummary)
      if (p.skills?.length) setSelectedSkillIds(p.skills.map(s => s.skillId || s.skill?.id).filter(Boolean))
      if (p.certifications?.length) setCertifications(p.certifications)
    }).catch(() => {})
  }, [])

  const toggleSkill = (id) => {
    setSelectedSkillIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const addCertification = (e) => {
    e.preventDefault()
    if (!certName.trim() || !certOrg.trim()) return
    setCertifications(prev => [
      ...prev,
      {
        name: certName.trim(),
        issuingOrg: certOrg.trim(),
        issueYear: certYear.trim(),
        credentialUrl: certUrl.trim()
      }
    ])
    setCertName('')
    setCertOrg('')
    setCertYear('')
    setCertUrl('')
  }

  const removeCertification = (index) => {
    setCertifications(prev => prev.filter((_, i) => i !== index))
  }

  // Completion calculation checklist
  const hasBasic = Boolean(name.trim() && professionalTitle.trim() && bio.trim())
  const hasSkills = selectedSkillIds.length > 0
  const hasPresence = Boolean(linkedinUrl.trim() || githubUrl.trim() || websiteUrl.trim())
  const hasExperience = Boolean(yearsOfExperience || experienceSummary.trim())
  const hasCertifications = certifications.length > 0
  const hasPortfolio = Boolean(portfolioTitle.trim())

  const itemsDone = [hasBasic, hasSkills, hasPresence, hasExperience, hasCertifications, hasPortfolio].filter(Boolean).length
  const completionPercentage = Math.round((itemsDone / 6) * 100)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Please provide your display name.')
      return
    }
    if (!professionalTitle.trim()) {
      setError('Please provide a professional title.')
      return
    }
    if (!bio.trim()) {
      setError('Please add a short professional bio describing your expertise.')
      return
    }

    setSaving(true)
    try {
      // 1. Update Freelancer Profile with isProfileCompleted = true
      await api.patch('/profile', {
        name: name.trim(),
        professionalTitle: professionalTitle.trim(),
        bio: bio.trim(),
        location: location.trim() || null,
        hourlyRate: hourlyRate ? Number(hourlyRate) : null,
        availability,
        experienceLevel,
        profileImage: profileImage.trim() || null,
        linkedinUrl: linkedinUrl.trim() || null,
        githubUrl: githubUrl.trim() || null,
        websiteUrl: websiteUrl.trim() || null,
        yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : null,
        experienceSummary: experienceSummary.trim() || null,
        skillIds: selectedSkillIds,
        certifications,
        isProfileCompleted: true
      })

      // 2. Persist optional work through the existing PortfolioProject API.
      if (portfolioTitle.trim()) {
        await api.post('/portfolio', {
          title: portfolioTitle.trim(),
          description: portfolioDesc.trim() || 'Portfolio showcase project',
          projectUrl: portfolioUrl.trim() || null,
          skillIds: selectedSkillIds.slice(0, 3)
        })
      }

      // 3. Refresh user state in AuthProvider
      if (refreshUser) await refreshUser()

      // 4. Redirect to Freelancer Dashboard
      navigate('/freelancer/dashboard', { replace: true })
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.message || 'Could not save profile setup. Please check all fields and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: '1040px', margin: '30px auto', padding: '0 20px' }}>
      {/* Onboarding Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--blue-soft)', color: 'var(--blue)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
          <Sparkles size={14} /> Step 2 of 2 · Account Setup
        </div>
        <h1 style={{ fontSize: '30px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.03em' }}>
          Complete your freelancer profile
        </h1>
        <p className="muted" style={{ fontSize: '15px', maxWidth: '580px', margin: '0 auto' }}>
          Highlight your professional background, skills, certifications, and portfolio so Indian clients can discover and hire you with confidence.
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

          {/* Section 1: Basic Information */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
              <User size={18} style={{ color: 'var(--blue)' }} /> 1. Basic Professional Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div className="field">
                <label>Display / Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                />
              </div>

              <div className="field">
                <label>Professional Headline / Title <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={professionalTitle}
                  onChange={(e) => setProfessionalTitle(e.target.value)}
                  placeholder="e.g. Senior Full-Stack React & Node Developer"
                  required
                />
              </div>
            </div>

            <div className="field" style={{ marginBottom: '14px' }}>
              <label>Professional Bio / About You <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your strengths, industry experience, and the kinds of projects you deliver best."
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
              <div className="field">
                <label>Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, India"
                />
              </div>

              <div className="field">
                <label>Hourly Rate (INR ₹)</label>
                <input
                  type="number"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="e.g. 2500"
                />
              </div>

              <div className="field">
                <label>Availability</label>
                <select value={availability} onChange={(e) => setAvailability(e.target.value)}>
                  <option value="FULL_TIME">Full Time (40h/wk)</option>
                  <option value="PART_TIME">Part Time (20h/wk)</option>
                  <option value="NOT_AVAILABLE">Not Available</option>
                </select>
              </div>

              <div className="field">
                <label>Experience Tier</label>
                <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                  <option value="ENTRY">Entry (1-3 yrs)</option>
                  <option value="INTERMEDIATE">Intermediate (3-6 yrs)</option>
                  <option value="EXPERT">Expert (6+ yrs)</option>
                </select>
              </div>
            </div>

            <div className="field" style={{ marginTop: '14px' }}>
              <label>Profile Photo URL</label>
              <input
                type="url"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="https://images.unsplash.com/... or avatar link"
              />
            </div>
          </div>

          {/* Section 2: Professional Presence */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
              <Globe size={18} style={{ color: 'var(--blue)' }} /> 2. Professional Presence
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div className="field">
                <label>LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/your-profile"
                />
              </div>

              <div className="field">
                <label>GitHub Profile URL</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/your-username"
                />
              </div>

              <div className="field">
                <label>Personal / Portfolio Website</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourportfolio.dev"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Experience & Skills */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
              <BriefcaseBusiness size={18} style={{ color: 'var(--blue)' }} /> 3. Experience & Skills
            </h3>

            <div className="field" style={{ marginBottom: '14px' }}>
              <label>Years of Professional Experience</label>
              <input
                type="number"
                min="0"
                max="50"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                placeholder="e.g. 5"
                style={{ maxWidth: '200px' }}
              />
            </div>

            <div className="field" style={{ marginBottom: '14px' }}>
              <label>Professional Experience Summary</label>
              <textarea
                rows={2}
                value={experienceSummary}
                onChange={(e) => setExperienceSummary(e.target.value)}
                placeholder="Brief summary of past companies, freelance client engagements, or open-source projects."
              />
            </div>

            <div className="field">
              <label>Relevant Skills (Select from database catalog)</label>
              {loadingSkills ? (
                <small className="muted">Loading skills…</small>
              ) : skillsList.length > 0 ? (
                <div className="check-grid" style={{ marginTop: '8px' }}>
                  {skillsList.map((skill) => (
                    <button
                      type="button"
                      key={skill.id}
                      className={`check-pill ${selectedSkillIds.includes(skill.id) ? 'selected' : ''}`}
                      onClick={() => toggleSkill(skill.id)}
                    >
                      <Check size={13} /> {skill.name}
                    </button>
                  ))}
                </div>
              ) : (
                <small className="muted">No skills in catalog.</small>
              )}
            </div>
          </div>

          {/* Section 4: Certifications */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
              <Award size={18} style={{ color: 'var(--blue)' }} /> 4. Certifications
            </h3>

            {certifications.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {certifications.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line)' }}>
                    <div>
                      <strong style={{ fontSize: '13px' }}>{c.name}</strong>
                      <span className="muted" style={{ fontSize: '12px', marginLeft: '8px' }}>
                        by {c.issuingOrg} {c.issueYear ? `(${c.issueYear})` : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCertification(idx)}
                      style={{ background: 'transparent', border: 0, color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '8px' }}>
                + Add a Certification
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="Certification Name (e.g. AWS Solutions Architect)"
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  style={{ fontSize: '13px', padding: '8px 10px' }}
                />
                <input
                  type="text"
                  placeholder="Issuing Organization (e.g. Amazon Web Services)"
                  value={certOrg}
                  onChange={(e) => setCertOrg(e.target.value)}
                  style={{ fontSize: '13px', padding: '8px 10px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Year (e.g. 2024)"
                  value={certYear}
                  onChange={(e) => setCertYear(e.target.value)}
                  style={{ fontSize: '13px', padding: '8px 10px' }}
                />
                <input
                  type="url"
                  placeholder="Credential URL (Optional)"
                  value={certUrl}
                  onChange={(e) => setCertUrl(e.target.value)}
                  style={{ fontSize: '13px', padding: '8px 10px' }}
                />
                <button
                  type="button"
                  onClick={addCertification}
                  disabled={!certName.trim() || !certOrg.trim()}
                  className="button button-outline button-small"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Initial Portfolio Project */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
              <Sparkles size={18} style={{ color: 'var(--blue)' }} /> 5. Showcase Work / Portfolio (Optional)
            </h3>

            <div className="field" style={{ marginBottom: '12px' }}>
              <label>Sample Project Title</label>
              <input
                type="text"
                placeholder="e.g. E-Commerce Multi-Vendor Marketplace"
                value={portfolioTitle}
                onChange={(e) => setPortfolioTitle(e.target.value)}
              />
            </div>

            <div className="field" style={{ marginBottom: '12px' }}>
              <label>Project Description</label>
              <textarea
                rows={2}
                placeholder="What problem did you solve and what technologies were used?"
                value={portfolioDesc}
                onChange={(e) => setPortfolioDesc(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Live Project URL / Demo</label>
              <input
                type="url"
                placeholder="https://..."
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
            <span className="muted" style={{ fontSize: '12px' }}>
              All fields can be edited anytime from your Profile page.
            </span>
            <Button disabled={saving} aria-busy={saving} className="button-primary">
              {saving ? 'Completing Setup…' : 'Complete Setup & Enter Dashboard'} <ArrowRight size={16} />
            </Button>
          </div>
        </form>

        {/* Sidebar: Progress Checklist & Signal */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px' }}>
          <div className="panel" style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <span className="panel-eyebrow">Profile Completion</span>
              <strong style={{ fontSize: '18px', color: 'var(--blue)' }}>{completionPercentage}%</strong>
            </div>

            <div className="progress" style={{ marginBottom: '16px', height: '8px' }}>
              <span style={{ width: `${completionPercentage}%`, transition: 'width 0.3s ease' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasBasic ? '#16a34a' : 'var(--muted)' }}>
                {hasBasic ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
                <span style={{ fontWeight: hasBasic ? 700 : 500 }}>Basic Information</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasSkills ? '#16a34a' : 'var(--muted)' }}>
                {hasSkills ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
                <span style={{ fontWeight: hasSkills ? 700 : 500 }}>Relevant Skills ({selectedSkillIds.length})</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasPresence ? '#16a34a' : 'var(--muted)' }}>
                {hasPresence ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
                <span style={{ fontWeight: hasPresence ? 700 : 500 }}>LinkedIn / GitHub</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasExperience ? '#16a34a' : 'var(--muted)' }}>
                {hasExperience ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
                <span style={{ fontWeight: hasExperience ? 700 : 500 }}>Years of Experience</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasCertifications ? '#16a34a' : 'var(--muted)' }}>
                {hasCertifications ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
                <span style={{ fontWeight: hasCertifications ? 700 : 500 }}>Certifications ({certifications.length})</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasPortfolio ? '#16a34a' : 'var(--muted)' }}>
                {hasPortfolio ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
                <span style={{ fontWeight: hasPortfolio ? 700 : 500 }}>Portfolio Project</span>
              </div>
            </div>
          </div>

          <div className="panel" style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', fontSize: '12px', color: 'var(--muted)' }}>
            <ShieldCheck size={18} style={{ color: 'var(--blue)', marginBottom: '8px' }} />
            <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>Why complete your profile?</strong>
            Freelancers with completed profiles, certifications, and skills receive 4x more direct project invites and faster proposal approvals from verified clients.
          </div>
        </aside>
      </div>
    </div>
  )
}
