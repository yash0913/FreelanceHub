from pathlib import Path

ROOT = Path(r"C:\Users\yasha\OneDrive\Desktop\FreelanceDBMS")

p = ROOT / "server/src/utils/profileCompletion.js"
s = p.read_text(encoding="utf-8")
s = s.replace(
    "const hasText = (value) => typeof value === 'string' && value.trim().length > 0\n",
    """const hasText = (value) => typeof value === 'string' && value.trim().length > 0

export const CUSTOMER_ORGANIZATION_TYPES = [
  'Individual / Personal', 'Startup', 'Small Business', 'Established Business', 'Agency', 'Other'
]
export const CUSTOMER_USE_CASES = [
  'Building a website', 'Software & app development', 'Design, UX & branding',
  'Marketing & SEO growth', 'Business operations & data analytics', 'Other / Ongoing freelance support'
]
""",
    1,
)
s = s.replace(
    "      hasText(user.name) &&\n      hasText(profile.organizationType) &&\n      hasText(profile.useCase) &&\n      (isPersonalCustomer(profile.organizationType) || hasText(profile.companyName))",
    "      hasText(user.name) &&\n      CUSTOMER_ORGANIZATION_TYPES.includes(profile.organizationType.trim()) &&\n      CUSTOMER_USE_CASES.includes(profile.useCase) &&\n      (isPersonalCustomer(profile.organizationType) || hasText(profile.companyName))",
    1,
)
p.write_text(s, encoding="utf-8")

p = ROOT / "server/src/controllers/marketplaceController.js"
s = p.read_text(encoding="utf-8")
s = s.replace(
    "import { isProfileComplete } from '../utils/profileCompletion.js'",
    "import { isProfileComplete, CUSTOMER_ORGANIZATION_TYPES, CUSTOMER_USE_CASES } from '../utils/profileCompletion.js'",
    1,
)
needle = """    // isProfileCompleted in the request is intentionally ignored. The value below
    // is derived from the saved account/profile records inside the transaction.
    const userData = {
"""
replacement = """    // isProfileCompleted in the request is intentionally ignored. The value below
    // is derived from the saved account/profile records inside the transaction.
    const textFields = [name, professionalTitle, bio, location, companyName, organizationType, useCase, website, linkedinUrl, githubUrl, websiteUrl, experienceSummary, profileImage]
    if (textFields.some((value) => value !== undefined && value !== null && typeof value !== 'string')) {
      return fail(res, 'Profile text fields must be strings')
    }
    if (organizationType !== undefined && organizationType !== null && !CUSTOMER_ORGANIZATION_TYPES.includes(String(organizationType).trim())) {
      return fail(res, 'Customer / organization type is invalid')
    }
    if (useCase !== undefined && useCase !== null && !CUSTOMER_USE_CASES.includes(String(useCase).trim())) {
      return fail(res, 'Customer use case is invalid')
    }
    const userData = {
"""
if needle not in s:
    raise RuntimeError("Profile handler validation insertion point not found")
s = s.replace(needle, replacement, 1)
p.write_text(s, encoding="utf-8")

p = ROOT / "client/src/App.jsx"
s = p.read_text(encoding="utf-8")
s = s.replace(
    "required={!isPersonal} /><Textarea label=\"About you or your organization\"",
    "required={Boolean(form.organizationType) && !isPersonal} /><Textarea label=\"About you or your organization\"",
    1,
)
p.write_text(s, encoding="utf-8")

p = ROOT / "client/src/pages/onboarding/CustomerProfileSetup.jsx"
s = p.read_text(encoding="utf-8")
s = s.replace(
    "<label>Company / Organization Name</label>",
    "<label>Company / Organization Name{!isPersonal && <span style={{ color: '#ef4444' }}> *</span>}</label>",
    1,
)
p.write_text(s, encoding="utf-8")

print("Applied customer profile validation follow-up.")
