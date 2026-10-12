export const buildUserProfileUpdateData = (role, { name, professionalTitle }) => ({
  ...(name !== undefined && String(name).trim() ? { name: String(name).trim() } : {}),
  ...(role === 'FREELANCER' && professionalTitle !== undefined
    ? { professionalTitle: professionalTitle ? String(professionalTitle).trim() : null }
    : {})
})
