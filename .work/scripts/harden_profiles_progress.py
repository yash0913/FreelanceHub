from pathlib import Path

ROOT = Path(r"C:\Users\yasha\OneDrive\Desktop\FreelanceDBMS")


def replace_between(relative_path, start_marker, end_marker, replacement):
    path = ROOT / relative_path
    text = path.read_text(encoding="utf-8")
    start = text.index(start_marker)
    end = text.index(end_marker, start)
    path.write_text(text[:start] + replacement + text[end:], encoding="utf-8")


def replace_once(relative_path, old, new):
    path = ROOT / relative_path
    text = path.read_text(encoding="utf-8")
    if old not in text:
        raise RuntimeError(f"Expected source snippet not found in {relative_path}: {old[:100]!r}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


# Shared completion rule. It never trusts the stored boolean; old customer profiles
# with meaningful legacy fields remain complete when the new onboarding columns are null.
(ROOT / "server/src/utils/profileCompletion.js").write_text("""const hasText = (value) => typeof value === 'string' && value.trim().length > 0

const isPersonalCustomer = (organizationType) => {
  const normalized = String(organizationType || '').toLowerCase()
  return normalized.includes('individual') || normalized.includes('personal')
}

export const isProfileComplete = (user) => {
  if (!user) return false
  if (user.role === 'ADMIN') return true

  if (user.role === 'FREELANCER') {
    const profile = user.freelancerProfile
    return Boolean(
      hasText(user.name) &&
      hasText(user.professionalTitle) &&
      hasText(profile?.bio)
    )
  }

  if (user.role === 'CUSTOMER') {
    const profile = user.customerProfile
    if (!profile) return false

    // Before onboarding fields existed, a saved company name or description was
    // the available evidence of a usable customer profile. Preserve that state.
    if (!hasText(profile.organizationType)) {
      return hasText(profile.companyName) || hasText(profile.bio)
    }

    return Boolean(
      hasText(user.name) &&
      hasText(profile.organizationType) &&
      hasText(profile.useCase) &&
      (isPersonalCustomer(profile.organizationType) || hasText(profile.companyName))
    )
  }

  return false
}
""", encoding="utf-8")

# Make login and /me compute completion from loaded profile data, not the boolean column.
replace_once(
    "server/src/controllers/authController.js",
    "import { PrismaClient } from '@prisma/client'\n",
    "import { PrismaClient } from '@prisma/client'\nimport { isProfileComplete } from '../utils/profileCompletion.js'\n",
)
replace_between(
    "server/src/controllers/authController.js",
    "const checkProfileCompletion = (user) => {",
    "\n\n// Email regex validator helper",
    "",
)
replace_once("server/src/controllers/authController.js", "checkProfileCompletion(user)", "isProfileComplete(user)")

# Replace the profile update endpoint with transactional, field-derived completion updates.
replace_between(
    "server/src/controllers/marketplaceController.js",
    "export const updateProfile = async (req, res) => {",
    "export const createCertification = async (req, res) => {",
    """export const updateProfile = async (req, res) => {
  try {
    if (!requireUser(req, res)) return
    const {
      name, professionalTitle, bio, hourlyRate, experienceLevel, location, availability,
      companyName, organizationType, useCase, website, linkedinUrl, githubUrl, websiteUrl,
      yearsOfExperience, experienceSummary, profileImage, skillIds, certifications
    } = req.body

    // isProfileCompleted in the request is intentionally ignored. The value below
    // is derived from the saved account/profile records inside the transaction.
    const userData = {
      ...(name !== undefined && String(name).trim() ? { name: String(name).trim() } : {}),
      ...(professionalTitle !== undefined ? { professionalTitle: professionalTitle ? String(professionalTitle).trim() : null } : {})
    }

    if (req.user.role === 'FREELANCER') {
      const normalizedRate = hourlyRate === '' || hourlyRate === null ? null : Number(hourlyRate)
      if (hourlyRate !== undefined && normalizedRate !== null && (!Number.isFinite(normalizedRate) || normalizedRate < 0)) {
        return fail(res, 'Hourly rate must be a valid non-negative amount')
      }

      const normalizedYears = yearsOfExperience === '' || yearsOfExperience === null
        ? null
        : Number(yearsOfExperience)
      if (yearsOfExperience !== undefined && normalizedYears !== null && (!Number.isInteger(normalizedYears) || normalizedYears < 0 || normalizedYears > 50)) {
        return fail(res, 'Years of experience must be a whole number between 0 and 50')
      }
      if (experienceLevel !== undefined && !['ENTRY', 'INTERMEDIATE', 'EXPERT'].includes(experienceLevel)) {
        return fail(res, 'Experience level is invalid')
      }
      if (availability !== undefined && !['FULL_TIME', 'PART_TIME', 'NOT_AVAILABLE'].includes(availability)) {
        return fail(res, 'Availability is invalid')
      }

      const normalizedText = (value) => value === null ? null : String(value).trim()
      const profileData = {
        ...(bio !== undefined ? { bio: normalizedText(bio) } : {}),
        ...(hourlyRate !== undefined ? { hourlyRate: normalizedRate } : {}),
        ...(experienceLevel !== undefined ? { experienceLevel } : {}),
        ...(location !== undefined ? { location: normalizedText(location) } : {}),
        ...(availability !== undefined ? { availability } : {}),
        ...(profileImage !== undefined ? { profileImage: normalizedText(profileImage) } : {}),
        ...(linkedinUrl !== undefined ? { linkedinUrl: normalizedText(linkedinUrl) } : {}),
        ...(githubUrl !== undefined ? { githubUrl: normalizedText(githubUrl) } : {}),
        ...(websiteUrl !== undefined ? { websiteUrl: normalizedText(websiteUrl) } : {}),
        ...(yearsOfExperience !== undefined ? { yearsOfExperience: normalizedYears } : {}),
        ...(experienceSummary !== undefined ? { experienceSummary: normalizedText(experienceSummary) } : {})
      }
      const normalizedSkillIds = Array.isArray(skillIds)
        ? [...new Set(skillIds.map(Number))]
        : null

      if (normalizedSkillIds?.some((skillId) => !Number.isSafeInteger(skillId) || skillId <= 0)) {
        return fail(res, 'One or more selected skills are invalid')
      }
      if (normalizedSkillIds?.length) {
        const existingSkills = await prisma.skill.findMany({ where: { id: { in: normalizedSkillIds } }, select: { id: true } })
        if (existingSkills.length !== normalizedSkillIds.length) return fail(res, 'One or more selected skills are unavailable')
      }
      if (Array.isArray(certifications) && certifications.some((cert) => !cert || typeof cert !== 'object')) {
        return fail(res, 'Certification details are invalid')
      }

      const profileId = await prisma.$transaction(async (tx) => {
        const savedUser = await tx.user.update({ where: { id: req.user.id }, data: userData })
        const savedProfile = await tx.freelancerProfile.upsert({
          where: { userId: req.user.id },
          create: { userId: req.user.id, ...profileData },
          update: profileData
        })
        if (normalizedSkillIds) {
          await tx.freelancerSkill.deleteMany({ where: { freelancerProfileId: savedProfile.id } })
          if (normalizedSkillIds.length) {
            await tx.freelancerSkill.createMany({
              data: normalizedSkillIds.map((skillId) => ({ freelancerProfileId: savedProfile.id, skillId }))
            })
          }
        }
        if (Array.isArray(certifications)) {
          await tx.certification.deleteMany({ where: { freelancerProfileId: savedProfile.id } })
          const validCerts = certifications.filter((cert) => String(cert.name || '').trim() && String(cert.issuingOrg || '').trim())
          if (validCerts.length) {
            await tx.certification.createMany({
              data: validCerts.map((cert) => ({
                freelancerProfileId: savedProfile.id,
                name: String(cert.name).trim(),
                issuingOrg: String(cert.issuingOrg).trim(),
                issueYear: cert.issueYear ? String(cert.issueYear).trim() : null,
                credentialUrl: cert.credentialUrl ? String(cert.credentialUrl).trim() : null
              }))
            })
          }
        }
        await tx.user.update({
          where: { id: req.user.id },
          data: { isProfileCompleted: isProfileComplete({ ...savedUser, freelancerProfile: savedProfile }) }
        })
        return savedProfile.id
      }, { timeout: 15000 })
      const profile = await prisma.freelancerProfile.findUnique({ where: { id: profileId }, include: profileInclude })
      return respond(res, profile, 'Profile updated')
    }

    if (req.user.role === 'CUSTOMER') {
      const customerData = {
        ...(bio !== undefined ? { bio: bio === null ? null : String(bio).trim() } : {}),
        ...(companyName !== undefined ? { companyName: companyName === null ? null : String(companyName).trim() } : {}),
        ...(organizationType !== undefined ? { organizationType: organizationType === null ? null : String(organizationType).trim() } : {}),
        ...(useCase !== undefined ? { useCase: useCase === null ? null : String(useCase).trim() } : {}),
        ...(website !== undefined ? { website: website === null ? null : String(website).trim() } : {}),
        ...(linkedinUrl !== undefined ? { linkedinUrl: linkedinUrl === null ? null : String(linkedinUrl).trim() } : {}),
        ...(location !== undefined ? { location: location === null ? null : String(location).trim() } : {}),
        ...(profileImage !== undefined ? { profileImage: profileImage === null ? null : String(profileImage).trim() } : {})
      }
      const profileId = await prisma.$transaction(async (tx) => {
        const savedUser = await tx.user.update({ where: { id: req.user.id }, data: userData })
        const savedProfile = await tx.customerProfile.upsert({
          where: { userId: req.user.id },
          create: { userId: req.user.id, ...customerData },
          update: customerData
        })
        await tx.user.update({
          where: { id: req.user.id },
          data: { isProfileCompleted: isProfileComplete({ ...savedUser, customerProfile: savedProfile }) }
        })
        return savedProfile.id
      })
      const profile = await prisma.customerProfile.findUnique({
        where: { id: profileId },
        include: { user: { select: userSelect } }
      })
      return respond(res, profile, 'Profile updated')
    }

    const user = await prisma.user.update({ where: { id: req.user.id }, data: userData, select: userSelect })
    return respond(res, user, 'Profile updated')
  } catch (error) {
    console.error('updateProfile Error:', error)
    return fail(res, 'Unable to update profile', 400)
  }
}

""",
)
replace_once(
    "server/src/controllers/marketplaceController.js",
    "import { PrismaClient } from '@prisma/client'\n",
    "import { PrismaClient } from '@prisma/client'\nimport { isProfileComplete } from '../utils/profileCompletion.js'\n",
)

# Customer onboarding requires a business name for organization types, but not for individuals.
replace_once(
    "client/src/pages/onboarding/CustomerProfileSetup.jsx",
    "  const hasType = Boolean(organizationType)\n  const hasUseCase = Boolean(useCase)\n  const hasCompany = Boolean(companyName.trim())",
    "  const isPersonal = organizationType === 'Individual / Personal'\n  const hasType = Boolean(organizationType)\n  const hasUseCase = Boolean(useCase)\n  const hasCompany = isPersonal || Boolean(companyName.trim())",
)
replace_once(
    "client/src/pages/onboarding/CustomerProfileSetup.jsx",
    "    if (!name.trim()) {\n      setError('Please provide your name.')\n      return\n    }\n\n    setSaving(true)",
    "    if (!name.trim()) {\n      setError('Please provide your name.')\n      return\n    }\n    if (!isPersonal && !companyName.trim()) {\n      setError('Please provide your business or organization name.')\n      return\n    }\n\n    setSaving(true)",
)
replace_once(
    "client/src/pages/onboarding/CustomerProfileSetup.jsx",
    "                  placeholder=\"e.g. Acme Tech Innovations\"\n                />",
    "                  placeholder=\"e.g. Acme Tech Innovations\"\n                  required={!isPersonal}\n                />",
)
replace_once(
    "client/src/pages/onboarding/CustomerProfileSetup.jsx",
    "                <span style={{ fontWeight: hasCompany ? 700 : 500 }}>Business Name</span>",
    "                <span style={{ fontWeight: hasCompany ? 700 : 500 }}>Business Name{isPersonal ? ' (optional for individuals)' : ''}</span>",
)

# Profile photo/logo form fields already use explicit URL input types and labels.
# Ensure portfolio API failures are not swallowed after the main profile request.
replace_once(
    "client/src/pages/onboarding/FreelancerProfileSetup.jsx",
    "      // 2. If a portfolio project was entered during setup, add it\n      if (portfolioTitle.trim()) {\n        try {\n          await api.post('/portfolio', {\n            title: portfolioTitle.trim(),\n            description: portfolioDesc.trim() || 'Portfolio showcase project',\n            projectUrl: portfolioUrl.trim() || null,\n            skillIds: selectedSkillIds.slice(0, 3)\n          })\n        } catch (portErr) {\n          console.error('Portfolio save note:', portErr)\n        }\n      }",
    "      // 2. Persist optional work through the existing PortfolioProject API.\n      if (portfolioTitle.trim()) {\n        await api.post('/portfolio', {\n          title: portfolioTitle.trim(),\n          description: portfolioDesc.trim() || 'Portfolio showcase project',\n          projectUrl: portfolioUrl.trim() || null,\n          skillIds: selectedSkillIds.slice(0, 3)\n        })\n      }",
)

# Replace existing profile-page components, keeping the canonical /profile and /portfolio APIs.
replace_between(
    "client/src/App.jsx",
    "function CustomerProfilePage() {",
    "function PortfolioPage() {",
    """function CustomerProfilePage() {
  const { user, refresh } = useAuth()
  const state = useFetch('/profile')
  const [form, setForm] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const organizationTypes = ['Individual / Personal', 'Startup', 'Small Business', 'Established Business', 'Agency', 'Other']
  const useCases = ['Building a website', 'Software & app development', 'Design, UX & branding', 'Marketing & SEO growth', 'Business operations & data analytics', 'Other / Ongoing freelance support']

  useEffect(() => {
    if (!state.loading) {
      const profile = state.data || {}
      setForm({
        name: profile.user?.name || user?.name || '',
        organizationType: profile.organizationType || '',
        useCase: profile.useCase || '',
        companyName: profile.companyName || '',
        bio: profile.bio || '',
        website: profile.website || '',
        linkedinUrl: profile.linkedinUrl || '',
        location: profile.location || '',
        profileImage: profile.profileImage || ''
      })
    }
  }, [state.loading, state.data, user])

  if (state.loading || !form) return <LoadingInline />
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  const isPersonal = form.organizationType === 'Individual / Personal'
  const completion = [Boolean(form.organizationType), Boolean(form.useCase), isPersonal || Boolean(form.companyName.trim()), Boolean(form.name.trim())].filter(Boolean).length * 25
  const save = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true); setError(''); setMessage('')
    try {
      const response = await api.patch('/profile', {
        ...form,
        organizationType: form.organizationType || null,
        useCase: form.useCase || null,
        companyName: form.companyName.trim() || null,
        bio: form.bio.trim() || null,
        website: form.website.trim() || null,
        linkedinUrl: form.linkedinUrl.trim() || null,
        location: form.location.trim() || null,
        profileImage: form.profileImage.trim() || null
      })
      state.setData(unwrap(response))
      await refresh()
      setMessage('Profile updated successfully.')
    } catch (err) { setError(apiError(err)) }
    finally { setSaving(false) }
  }

  return <><PageIntro eyebrow="Customer identity" title="Make your customer profile clear." description="Edit the same customer profile used during onboarding and throughout the marketplace." />{message && <div className="success-banner"><Check size={17} />{message}</div>}{error && <ErrorState message={error} />}<div className="two-column"><form className="panel form-panel" onSubmit={save}><div className="panel-heading"><div><span className="panel-eyebrow">Profile completion</span><h2>{completion}% complete</h2></div><span className="required-note">Business name is optional for individuals</span></div><div className="progress" style={{ marginBottom: '22px' }}><span style={{ width: `${completion}%` }} /></div><Input label="Full name" value={form.name} onChange={update('name')} required /><Select label="Customer / organization type" value={form.organizationType} onChange={update('organizationType')} required><option value="">Choose a type</option>{organizationTypes.map((type) => <option key={type} value={type}>{type}</option>)}</Select><Select label="Primary use case" value={form.useCase} onChange={update('useCase')} required><option value="">Choose a use case</option>{useCases.map((item) => <option key={item} value={item}>{item}</option>)}</Select><Input label="Business / organization name" value={form.companyName} onChange={update('companyName')} placeholder={isPersonal ? 'Optional for individuals' : 'Company name'} required={!isPersonal} /><Textarea label="About you or your organization" value={form.bio} onChange={update('bio')} placeholder="Share your goals, context, and what you value in a freelancer." /><div className="form-grid-two"><Input label="Website URL" type="url" value={form.website} onChange={update('website')} placeholder="https://company.example" /><Input label="LinkedIn / company profile URL" type="url" value={form.linkedinUrl} onChange={update('linkedinUrl')} placeholder="https://linkedin.com/company/…" /></div><div className="form-grid-two"><Input label="Location" value={form.location} onChange={update('location')} placeholder="City, country" /><Input label="Logo / photo URL" type="url" value={form.profileImage} onChange={update('profileImage')} placeholder="https://…" /></div><p className="muted" style={{ fontSize: '12px' }}>Images are stored as URLs; this form does not upload files.</p><div className="form-actions"><Button disabled={saving} aria-busy={saving}>{saving ? 'Saving…' : 'Save profile'} {!saving && <Check size={16} />}</Button></div></form><section className="panel"><div className="panel-heading"><div><span className="panel-eyebrow">Customer profile</span><h2>{form.name}</h2></div><Avatar name={form.name} size="sm" /></div><div className="profile-facts"><div><span>Account</span><strong>{user?.email}</strong></div><div><span>Type</span><strong>{form.organizationType || 'Not selected'}</strong></div><div><span>Use case</span><strong>{form.useCase || 'Not selected'}</strong></div><div><span>Organization</span><strong>{form.companyName || 'Individual / not added'}</strong></div><div><span>Location</span><strong>{form.location || 'Not added'}</strong></div><div><span>Website</span><strong>{form.website || 'Not added'}</strong></div><div><span>LinkedIn</span><strong>{form.linkedinUrl || 'Not added'}</strong></div><div><span>Logo URL</span><strong>{form.profileImage || 'Not added'}</strong></div></div></section></div></>
}

function ProfilePage() {
  const { user, refresh } = useAuth()
  if (user?.role === 'CUSTOMER') return <CustomerProfilePage />
  const state = useFetch('/profile')
  const skills = useFetch('/skills')
  const [form, setForm] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!state.loading && !state.error) {
      const profile = state.data || {}
      setForm({
        name: profile.user?.name || user?.name || '',
        professionalTitle: profile.user?.professionalTitle || user?.professionalTitle || '',
        bio: profile.bio || '',
        profileImage: profile.profileImage || '',
        hourlyRate: profile.hourlyRate ?? '',
        experienceLevel: profile.experienceLevel || 'INTERMEDIATE',
        location: profile.location || '',
        availability: profile.availability || 'FULL_TIME',
        linkedinUrl: profile.linkedinUrl || '',
        githubUrl: profile.githubUrl || '',
        websiteUrl: profile.websiteUrl || '',
        yearsOfExperience: profile.yearsOfExperience ?? '',
        experienceSummary: profile.experienceSummary || '',
        skillIds: (profile.skills || []).map(({ skill }) => skill?.id).filter(Boolean),
        certifications: (profile.certifications || []).map(({ name, issuingOrg, issueYear, credentialUrl }) => ({ name, issuingOrg, issueYear: issueYear || '', credentialUrl: credentialUrl || '' }))
      })
    }
  }, [state.loading, state.error, state.data, user])

  if (state.loading) return <LoadingInline />
  if (state.error && !state.data) {
    return <><PageIntro eyebrow="Professional identity" title="Your profile" description="Your authenticated profile is looked up from your user account." /><div className="panel" role="alert"><ErrorState message="We could not load your freelancer profile. Your dashboard is still available." /><Button variant="outline" onClick={state.refetch}>Try again</Button></div></>
  }
  if (!form) return <LoadingInline />

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  const toggleSkill = (id) => setForm((current) => ({ ...current, skillIds: current.skillIds.includes(id) ? current.skillIds.filter((item) => item !== id) : [...current.skillIds, id] }))
  const updateCertification = (index, key, value) => setForm((current) => ({ ...current, certifications: current.certifications.map((cert, i) => i === index ? { ...cert, [key]: value } : cert) }))
  const save = async (event) => {
    event.preventDefault(); setError(''); setMessage(''); setSaving(true)
    try {
      const response = await api.patch('/profile', form)
      state.setData(unwrap(response))
      await refresh()
      setMessage('Profile updated successfully.')
    } catch (err) { setError(err?.response?.data?.message || 'We could not save your profile. Check the selected fields and try again.') }
    finally { setSaving(false) }
  }
  const hasBio = Boolean(form.bio.trim())
  const hasTitle = Boolean(form.professionalTitle.trim())
  const hasName = Boolean(form.name.trim())
  const completion = Math.round(([hasName, hasTitle, hasBio].filter(Boolean).length / 3) * 100)
  const freelancerProfileId = validRecordId(state.data?.id)
  const portfolioProjects = state.data?.portfolioProjects || []

  return <><PageIntro eyebrow="Professional identity" title="Make your profile work harder." description="Edit the same freelancer profile used during onboarding, including professional details, skills, certifications, and links to your saved portfolio." />{message && <div className="success-banner"><Check size={17} />{message}</div>}{error && <ErrorState message={error} />}<div className="two-column"><form className="panel form-panel" onSubmit={save}><div className="panel-heading"><div><span className="panel-eyebrow">Profile completion</span><h2>{completion}% complete</h2></div><span className="required-note">Name, title, and bio are required</span></div><div className="progress" style={{ marginBottom: '22px' }}><span style={{ width: `${completion}%` }} /></div><Input label="Full name" value={form.name} onChange={update('name')} required /><Input label="Professional headline / title" value={form.professionalTitle} onChange={update('professionalTitle')} required /><Textarea label="Professional bio" value={form.bio} onChange={update('bio')} placeholder="Describe your strengths, experience, and the problems you solve." required /><Input label="Profile photo URL" type="url" value={form.profileImage} onChange={update('profileImage')} placeholder="https://…" /><p className="muted" style={{ fontSize: '12px' }}>Images are stored as URLs; this form does not upload files.</p><div className="form-grid-two"><Select label="Experience level" value={form.experienceLevel} onChange={update('experienceLevel')}><option value="ENTRY">Entry</option><option value="INTERMEDIATE">Intermediate</option><option value="EXPERT">Expert</option></Select><Input label="Hourly rate (INR)" type="number" min="0" value={form.hourlyRate} onChange={update('hourlyRate')} placeholder="2500" /></div><div className="form-grid-two"><Select label="Availability" value={form.availability} onChange={update('availability')}><option value="FULL_TIME">Full time</option><option value="PART_TIME">Part time</option><option value="NOT_AVAILABLE">Not available</option></Select><Input label="Location" value={form.location} onChange={update('location')} placeholder="Bengaluru, India" /></div><div className="form-grid-three"><Input label="Years of experience" type="number" min="0" max="50" value={form.yearsOfExperience} onChange={update('yearsOfExperience')} /><Input label="LinkedIn URL" type="url" value={form.linkedinUrl} onChange={update('linkedinUrl')} /><Input label="GitHub URL" type="url" value={form.githubUrl} onChange={update('githubUrl')} /></div><Input label="Website / portfolio URL" type="url" value={form.websiteUrl} onChange={update('websiteUrl')} /><Textarea label="Experience summary" value={form.experienceSummary} onChange={update('experienceSummary')} placeholder="Previous roles, client engagements, or open-source work." /><div className="field"><span>Skills from the live database</span>{skills.loading ? <small>Loading skills…</small> : skills.error ? <small role="alert">Skills are temporarily unavailable. Your existing selections are preserved.</small> : skills.data?.length ? <div className="check-grid">{skills.data.map((skill) => <button type="button" aria-pressed={form.skillIds.includes(skill.id)} className={`check-pill ${form.skillIds.includes(skill.id) ? 'selected' : ''}`} key={skill.id} onClick={() => toggleSkill(skill.id)}><Check size={13} />{skill.name}</button>)}</div> : <small>No skills are available in the catalog yet.</small>}</div><div className="field"><span>Certifications</span>{form.certifications.map((cert, index) => <div className="panel" key={`${index}-${cert.name}`} style={{ marginBottom: '10px', padding: '12px' }}><div className="form-grid-two"><Input label="Certification name" value={cert.name} onChange={(event) => updateCertification(index, 'name', event.target.value)} /><Input label="Issuing organization" value={cert.issuingOrg} onChange={(event) => updateCertification(index, 'issuingOrg', event.target.value)} /></div><div className="form-grid-two"><Input label="Issue year" value={cert.issueYear} onChange={(event) => updateCertification(index, 'issueYear', event.target.value)} /><Input label="Credential URL" type="url" value={cert.credentialUrl} onChange={(event) => updateCertification(index, 'credentialUrl', event.target.value)} /></div><Button type="button" variant="outline" onClick={() => setForm((current) => ({ ...current, certifications: current.certifications.filter((_, i) => i !== index) }))}>Remove certification</Button></div>)}<Button type="button" variant="outline" onClick={() => setForm((current) => ({ ...current, certifications: [...current.certifications, { name: '', issuingOrg: '', issueYear: '', credentialUrl: '' }] }))}>Add certification</Button></div><div className="form-actions"><Button disabled={saving} aria-busy={saving}>{saving ? 'Saving…' : 'Save profile'} {!saving && <Check size={16} />}</Button></div></form><section className="panel"><div className="panel-heading"><div><span className="panel-eyebrow">Profile signal</span><h2>What clients will see</h2></div><Avatar name={form.name} size="sm" /></div><div className="profile-facts"><div><span>Professional title</span><strong>{form.professionalTitle || 'Add a title'}</strong></div><div><span>Experience</span><strong>{titleCase(form.experienceLevel)}</strong></div><div><span>Years</span><strong>{form.yearsOfExperience || 'Not added'}</strong></div><div><span>Availability</span><strong>{titleCase(form.availability)}</strong></div><div><span>Location</span><strong>{form.location || 'Not added'}</strong></div><div><span>Hourly rate</span><strong>{form.hourlyRate ? `${currency(form.hourlyRate)} / hour` : 'Not added'}</strong></div><div><span>LinkedIn</span><strong>{form.linkedinUrl || 'Not added'}</strong></div><div><span>GitHub</span><strong>{form.githubUrl || 'Not added'}</strong></div><div><span>Website</span><strong>{form.websiteUrl || 'Not added'}</strong></div><div><span>Certifications</span><strong>{form.certifications.length}</strong></div><div><span>Portfolio</span><strong>{portfolioProjects.length ? `${portfolioProjects.length} project(s)` : 'Add your first project'}</strong></div></div>{portfolioProjects.length > 0 && <div style={{ marginTop: '18px' }}><strong>Saved portfolio projects</strong>{portfolioProjects.map((project) => <div key={project.id} style={{ marginTop: '8px' }}><strong>{project.title}</strong>{project.description && <p className="muted" style={{ margin: '3px 0' }}>{project.description}</p>}{project.projectUrl && <a href={project.projectUrl} target="_blank" rel="noreferrer">View project</a>}</div>)}</div>}{freelancerProfileId ? <Link className="button button-outline button-full" to={`/freelancer/${freelancerProfileId}`} style={{ marginTop: '20px' }}>Preview public profile <ArrowRight size={15} /></Link> : <p className="muted" style={{ fontSize: '11px', marginTop: '20px' }}>Save your profile to make your public profile available.</p>}<Link className="text-link" to="/freelancer/portfolio" style={{ marginTop: '15px' }}>Manage portfolio projects <ArrowRight size={14} /></Link></section></div></>
}

""",
)

# Progress update safety: allow only known progress UI values, authorize assigned freelancer/admin,
# and transition project + contract only to their existing COMPLETED enum values.
replace_once(
    "server/src/controllers/progressController.js",
    "const VALID_STAGES = [\n  'REQUIREMENTS',\n  'DEVELOPMENT',\n  'CLIENT_REVIEW',\n  'REVISIONS',\n  'FINAL_DELIVERY',\n  'COMPLETED'\n]\n",
    "const VALID_STAGES = [\n  'REQUIREMENTS',\n  'DEVELOPMENT',\n  'CLIENT_REVIEW',\n  'REVISIONS',\n  'FINAL_DELIVERY',\n  'COMPLETED'\n]\n\nconst VALID_PROGRESS_STATUSES = [\n  'NOT_STARTED',\n  'IN_PROGRESS',\n  'CLIENT_REVIEW',\n  'WAITING_FOR_CLIENT',\n  'BLOCKED',\n  'COMPLETED'\n]\n",
)
replace_between(
    "server/src/controllers/progressController.js",
    "export const createProjectProgressUpdate = async (req, res) => {",
    "export const listNotifications = async (req, res) => {",
    """export const createProjectProgressUpdate = async (req, res) => {
  try {
    const projectId = idOf(req.params.id)
    if (!projectId) return fail(res, 'Invalid project ID', 400)

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { contract: true }
    })

    if (!project) return fail(res, 'Project not found', 404)

    // Admins retain their existing operational override. Other users must be
    // the freelancer assigned to this exact project's contract.
    const isFreelancer = req.user.role === 'FREELANCER' && project.contract?.freelancerId === req.user.id
    const isAdmin = req.user.role === 'ADMIN'
    if (!isFreelancer && !isAdmin) {
      return fail(res, 'Only the assigned freelancer or an admin can update progress for this project', 403)
    }

    const {
      stage,
      progressPercentage,
      status,
      note,
      actionRequired,
      actionNote,
      expectedCompletion
    } = req.body

    if (!stage || !VALID_STAGES.includes(stage)) {
      return fail(res, `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}`, 400)
    }

    const percentage = Number(progressPercentage)
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      return fail(res, 'Progress percentage must be between 0 and 100', 400)
    }
    if (status !== undefined && !VALID_PROGRESS_STATUSES.includes(status)) {
      return fail(res, `Invalid progress status. Must be one of: ${VALID_PROGRESS_STATUSES.join(', ')}`, 400)
    }
    if (actionRequired !== undefined && typeof actionRequired !== 'boolean') {
      return fail(res, 'Action required must be a boolean', 400)
    }

    const requestedDate = expectedCompletion ? new Date(expectedCompletion) : null
    if (requestedDate && !Number.isFinite(requestedDate.getTime())) {
      return fail(res, 'Expected completion must be a valid date', 400)
    }

    const roundedPercentage = Math.round(percentage)
    const isComplete = stage === 'COMPLETED' || roundedPercentage === 100
    const savedPercentage = isComplete ? 100 : roundedPercentage
    const savedStage = isComplete ? 'COMPLETED' : stage
    const savedStatus = isComplete ? 'COMPLETED' : (status || 'IN_PROGRESS')
    const requiresAction = actionRequired === true
    const cleanNote = note ? String(note).trim() : null
    const cleanActionNote = requiresAction && actionNote ? String(actionNote).trim() : null
    const targetDate = requestedDate

    const progressUpdate = await prisma.$transaction(async (tx) => {
      const update = await tx.projectProgressUpdate.create({
        data: {
          projectId,
          contractId: project.contract?.id || null,
          updatedById: req.user.id,
          stage: savedStage,
          progressPercentage: savedPercentage,
          status: savedStatus,
          note: cleanNote,
          actionRequired: requiresAction,
          actionNote: cleanActionNote,
          expectedCompletion: targetDate
        },
        include: { updatedBy: { select: userSelect } }
      })

      if (isComplete) {
        // These are the existing Prisma enum values: ProjectStatus.COMPLETED
        // and ContractStatus.COMPLETED (not progress-only status strings).
        await tx.project.update({ where: { id: projectId }, data: { status: 'COMPLETED' } })
        if (project.contract) {
          await tx.contract.update({
            where: { id: project.contract.id },
            data: { status: 'COMPLETED', endDate: new Date() }
          })
        }
      }

      const stageName = STAGE_LABELS[savedStage] || savedStage
      const notifTitle = requiresAction
        ? `Action Required: ${project.title}`
        : isComplete
          ? `Project Completed: ${project.title}`
          : `Progress Update: ${project.title}`
      const notifMsg = requiresAction
        ? `${req.user.name} requested action on "${project.title}": ${cleanActionNote || 'Please review progress.'}`
        : `${req.user.name} updated "${project.title}" to ${stageName} (${savedPercentage}%). ${cleanNote || ''}`
      await tx.notification.create({
        data: {
          userId: project.clientId,
          title: notifTitle,
          message: notifMsg.trim(),
          type: requiresAction ? 'ACTION_REQUIRED' : isComplete ? 'COMPLETED' : 'PROGRESS_UPDATE',
          link: `/customer/projects/${project.id}`
        }
      })
      return update
    })

    return respond(res, {
      ...progressUpdate,
      stageLabel: STAGE_LABELS[progressUpdate.stage] || progressUpdate.stage
    }, 'Project progress updated successfully', 201)
  } catch (error) {
    console.error('createProjectProgressUpdate Error:', error)
    return fail(res, 'Unable to update project progress', 500)
  }
}

""",
)

# Clarify the progress-only string vocabulary in the schema comment; no model/field changes here.
replace_once(
    "server/prisma/schema.prisma",
    "status             String    @default(\"IN_PROGRESS\") // NOT_STARTED, IN_PROGRESS, UNDER_REVIEW, BLOCKED, COMPLETED",
    "status             String    @default(\"IN_PROGRESS\") // NOT_STARTED, IN_PROGRESS, CLIENT_REVIEW, WAITING_FOR_CLIENT, BLOCKED, COMPLETED",
)

print("Applied focused profile and progress hardening edits.")
