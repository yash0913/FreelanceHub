const hasText = (value) => typeof value === 'string' && value.trim().length > 0


export const CUSTOMER_ORGANIZATION_TYPES = [
  'Individual / Personal', 'Startup', 'Small Business', 'Established Business', 'Agency', 'Other'
]
export const CUSTOMER_USE_CASES = [
  'Building a website', 'Software & app development', 'Design, UX & branding',
  'Marketing & SEO growth', 'Business operations & data analytics', 'Other / Ongoing freelance support'
]

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

    // Migration backfills the backend-owned flag for legacy customers with prior
    // profile data. New accounts start false and cannot use this compatibility path.
    if (!hasText(profile.organizationType)) {
      return Boolean(user.isProfileCompleted === true && hasText(user.name) && (hasText(profile.companyName) || hasText(profile.bio)))
    }

    return Boolean(
      hasText(user.name) &&
      CUSTOMER_ORGANIZATION_TYPES.includes(profile.organizationType.trim()) &&
      CUSTOMER_USE_CASES.includes(profile.useCase) &&
      (isPersonalCustomer(profile.organizationType) || hasText(profile.companyName))
    )
  }

  return false
}
