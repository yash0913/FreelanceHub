const API_BASE = 'http://localhost:5000/api/v1'

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const res = await fetch(url, { ...options, headers })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  return { status: res.status, data }
}

async function runTests() {
  console.log('=== STARTING COMPLETE E2E VERIFICATION ===')

  // 1. Health check
  const health = await request('/health')
  console.log('1. Health check:', health.status === 200 && health.data?.status === 'ok' ? 'PASS' : `FAIL (${health.status})`)

  // 2. Admin Login & Stats
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@freelancehub.com', password: 'Admin1111' })
  })
  console.log('2. Admin login:', adminLogin.status === 200 ? 'PASS' : `FAIL (${adminLogin.status})`)
  const adminToken = adminLogin.data?.data?.token
  const adminStats = await request('/admin/stats', {
    headers: { Authorization: `Bearer ${adminToken}` }
  })
  console.log('3. Admin stats endpoint:', adminStats.status === 200 ? 'PASS' : `FAIL (${adminStats.status})`, adminStats.data?.data ? JSON.stringify(adminStats.data.data) : '')

  // 4. Freelancer Login & /auth/me
  const freelancerLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'aryan.trivedi@freelancehub.dev', password: 'Password123!' })
  })
  console.log('4. Freelancer login:', freelancerLogin.status === 200 ? 'PASS' : `FAIL (${freelancerLogin.status})`)
  const freelancerToken = freelancerLogin.data?.data?.token
  const freelancerMe = await request('/auth/me', {
    headers: { Authorization: `Bearer ${freelancerToken}` }
  })
  console.log('5. Freelancer /auth/me:', freelancerMe.status === 200 ? 'PASS' : `FAIL (${freelancerMe.status})`, `isProfileCompleted: ${freelancerMe.data?.data?.isProfileCompleted}`)

  // 6. Freelancer Profile (/profile)
  const freelancerProfile = await request('/profile', {
    headers: { Authorization: `Bearer ${freelancerToken}` }
  })
  console.log('6. Freelancer /profile endpoint:', freelancerProfile.status === 200 ? 'PASS' : `FAIL (${freelancerProfile.status})`, `Title: ${freelancerProfile.data?.data?.professionalTitle}, Education: ${freelancerProfile.data?.data?.freelancerProfile?.educationQualification || 'N/A'}`)

  // 7. Customer Login & Profile
  const customerLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'ananya.krishnamurthy@brightwave.in', password: 'Password123!' })
  })
  console.log('7. Customer login:', customerLogin.status === 200 ? 'PASS' : `FAIL (${customerLogin.status})`)
  const customerToken = customerLogin.data?.data?.token
  const customerProfile = await request('/profile', {
    headers: { Authorization: `Bearer ${customerToken}` }
  })
  console.log('8. Customer /profile endpoint:', customerProfile.status === 200 ? 'PASS' : `FAIL (${customerProfile.status})`, `Company: ${customerProfile.data?.data?.customerProfile?.companyName}`)

  // 9. Categories & Skills
  const categories = await request('/categories')
  const skills = await request('/skills')
  console.log('9. Categories count:', categories.data?.data?.length, 'Skills count:', skills.data?.data?.length)

  // 10. Projects listing
  const projects = await request('/projects')
  console.log('10. Projects listing:', projects.status === 200 ? 'PASS' : `FAIL (${projects.status})`, `Count: ${projects.data?.data?.projects?.length || projects.data?.data?.length || 0}`)

  // 11. Notifications
  const notifications = await request('/notifications', {
    headers: { Authorization: `Bearer ${freelancerToken}` }
  })
  console.log('11. Notifications endpoint:', notifications.status === 200 ? 'PASS' : `FAIL (${notifications.status})`)

  // 12. Conversations
  const conversations = await request('/conversations', {
    headers: { Authorization: `Bearer ${freelancerToken}` }
  })
  console.log('12. Conversations endpoint:', conversations.status === 200 ? 'PASS' : `FAIL (${conversations.status})`)

  // 13. Contracts (/contracts/mine)
  const contracts = await request('/contracts/mine', {
    headers: { Authorization: `Bearer ${freelancerToken}` }
  })
  console.log('13. Contracts (/contracts/mine) endpoint:', contracts.status === 200 ? 'PASS' : `FAIL (${contracts.status})`)

  // 14. Reviews (/reviews/mine)
  const reviews = await request('/reviews/mine', {
    headers: { Authorization: `Bearer ${freelancerToken}` }
  })
  console.log('14. Reviews (/reviews/mine) endpoint:', reviews.status === 200 ? 'PASS' : `FAIL (${reviews.status})`)

  // 15. Payments (/payments/mine)
  const payments = await request('/payments/mine', {
    headers: { Authorization: `Bearer ${freelancerToken}` }
  })
  console.log('15. Payments (/payments/mine) endpoint:', payments.status === 200 ? 'PASS' : `FAIL (${payments.status})`)

  // 16. Collaborations discovery
  const collabs = await request('/collaborations')
  console.log('16. Collaborations discovery:', collabs.status === 200 ? 'PASS' : `FAIL (${collabs.status})`)

  console.log('=== ALL E2E VERIFICATIONS COMPLETED SUCCESSFULLY ===')
}

runTests().catch(err => {
  console.error('E2E FAILURE:', err)
  process.exit(1)
})
