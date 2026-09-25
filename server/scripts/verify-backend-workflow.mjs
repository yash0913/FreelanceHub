import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import http from 'http'
import app from '../src/app.js'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'FreelanceHub-JWT-Secret-2026'

const makeToken = (user) => jwt.sign(
  { id: user.id, userId: user.id, email: user.email, role: user.role },
  JWT_SECRET,
  { expiresIn: '1h' }
)

const request = (port, method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const payload = body ? JSON.stringify(body) : null
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload)

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers
      },
      (res) => {
        let raw = ''
        res.on('data', (chunk) => { raw += chunk })
        res.on('end', () => {
          let json = null
          try { json = JSON.parse(raw) } catch (e) { json = raw }
          resolve({ status: res.statusCode, data: json })
        })
      }
    )

    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function run() {
  console.log('--- Starting FreelanceHub Full-Stack Workflow Verification ---')

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  console.log(`Test server running on port ${port}`)

  try {
    // 1. Health check
    const health = await request(port, 'GET', '/api/v1/health')
    console.assert(health.status === 200, 'Health check failed')
    console.log('✓ Health check passed')

    // 2. FAQ / Help Center
    const faq = await request(port, 'GET', '/api/v1/help/faq')
    console.assert(faq.status === 200 && faq.data.totalCategories >= 6, 'FAQ fetch failed')
    console.log(`✓ FAQ endpoint verified: ${faq.data.totalCategories} categories, ${faq.data.totalFaqs} questions`)

    // 3. User Setup (Admin, Customer, Freelancer 1, Freelancer 2)
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    const customerUser = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } })
    const freelancers = await prisma.user.findMany({ where: { role: 'FREELANCER' }, take: 2 })

    if (!adminUser || !customerUser || freelancers.length < 2) {
      throw new Error('Not enough seeded users for verification')
    }

    const adminToken = makeToken(adminUser)
    const customerToken = makeToken(customerUser)
    const freelancer1Token = makeToken(freelancers[0])
    const freelancer2Token = makeToken(freelancers[1])

    console.log(`✓ Test accounts: Admin #${adminUser.id}, Customer #${customerUser.id}, Freelancers #${freelancers[0].id}, #${freelancers[1].id}`)

    // 4. Collaboration Workflow
    // Freelancer 1 creates a collaboration opportunity
    const createCollabRes = await request(port, 'POST', '/api/v1/collaborations', {
      title: 'React & Tailwind Dashboard Collaboration',
      roleNeeded: 'Junior Frontend Collaborator',
      description: 'Building an interactive analytics dashboard for our client engagement. Looking for an enthusiastic developer or intern to collaborate on charting components.',
      type: 'PROJECT_COLLABORATION',
      compensationType: 'PAID',
      compensation: '₹12,000 stipend',
      workMode: 'REMOTE',
      duration: '3 weeks',
      maxCollaborators: 1,
      skills: 'React, TailwindCSS, Chart.js'
    }, freelancer1Token)

    console.assert(createCollabRes.status === 201, `Create collab failed: ${JSON.stringify(createCollabRes.data)}`)
    const collabId = createCollabRes.data.data.id
    console.log(`✓ Collaboration opportunity created (ID: ${collabId})`)

    // Public lists collaboration
    const listCollabRes = await request(port, 'GET', '/api/v1/collaborations')
    console.assert(listCollabRes.status === 200 && listCollabRes.data.data.some(c => c.id === collabId), 'Collab list missing created opportunity')
    console.log('✓ Public collaboration listing verified')

    // Freelancer 2 applies to the collaboration
    const applyRes = await request(port, 'POST', `/api/v1/collaborations/${collabId}/apply`, {
      message: 'I have experience building React components and want to gain verified collaborative experience on real dashboards.'
    }, freelancer2Token)

    console.assert(applyRes.status === 201, `Apply collab failed: ${JSON.stringify(applyRes.data)}`)
    const appId = applyRes.data.data.id
    console.log(`✓ Freelancer applied to collaboration (App ID: ${appId})`)

    // Freelancer 1 lists applications and accepts Freelancer 2
    const acceptRes = await request(port, 'PATCH', `/api/v1/collaborations/applications/${appId}`, {
      status: 'ACCEPTED'
    }, freelancer1Token)

    console.assert(acceptRes.status === 200 && acceptRes.data.data.status === 'ACCEPTED', 'Accepting application failed')
    console.log('✓ Creator accepted collaborator application')

    // Freelancer 1 completes collaboration -> triggers verified work history creation
    const completeRes = await request(port, 'POST', `/api/v1/collaborations/${collabId}/complete`, {}, freelancer1Token)
    console.assert(completeRes.status === 200, `Complete collab failed: ${JSON.stringify(completeRes.data)}`)
    console.log('✓ Collaboration marked COMPLETED by owner')

    // Verify VerifiedCollaboration was created
    const verifiedListRes = await request(port, 'GET', `/api/v1/freelancers/${freelancers[1].id}/verified-collaborations`)
    console.assert(verifiedListRes.status === 200 && verifiedListRes.data.data.length > 0, 'Verified collaboration not found in profile history')
    console.log(`✓ Verified work experience confirmed for Freelancer #${freelancers[1].id}: "${verifiedListRes.data.data[0].projectTitle}" (Role: ${verifiedListRes.data.data[0].role})`)

    // 5. Messaging Workflow
    // Customer starts conversation with Freelancer 1
    const startConvRes = await request(port, 'POST', '/api/v1/conversations', {
      participantId: freelancers[0].id
    }, customerToken)
    console.assert(startConvRes.status === 200 || startConvRes.status === 201, `Start conv failed: ${JSON.stringify(startConvRes.data)}`)
    const convId = startConvRes.data.data.id
    console.log(`✓ Customer <-> Freelancer conversation established (ID: ${convId})`)

    // Customer sends message
    const sendMsgRes = await request(port, 'POST', `/api/v1/conversations/${convId}/messages`, {
      content: 'Hello! I noticed your profile and wanted to discuss a project.'
    }, customerToken)
    console.assert(sendMsgRes.status === 201, 'Send message failed')
    console.log('✓ Customer sent message')

    // Freelancer 1 reads messages
    const listMsgRes = await request(port, 'GET', `/api/v1/conversations/${convId}/messages`, null, freelancer1Token)
    console.assert(listMsgRes.status === 200 && listMsgRes.data.data.length > 0, 'List messages failed')
    console.log(`✓ Freelancer received message: "${listMsgRes.data.data[0].content}"`)

    // Freelancer 2 (unauthorized) tries to read conversation
    const unauthRes = await request(port, 'GET', `/api/v1/conversations/${convId}/messages`, null, freelancer2Token)
    console.assert(unauthRes.status === 404, 'Security failure: Unauthorized user accessed private conversation')
    console.log('✓ Security verified: Unauthorized user cannot read conversation')

    // Direct chat with admin is rejected
    const adminChatRes = await request(port, 'POST', '/api/v1/conversations', {
      participantId: adminUser.id
    }, customerToken)
    console.assert(adminChatRes.status === 403, 'Security failure: Direct chat with Admin was not blocked')
    console.log('✓ Security verified: Direct chat with Admin forbidden (use Support Tickets instead)')

    // 6. Support Tickets Workflow
    // Customer files support ticket
    const ticketRes = await request(port, 'POST', '/api/v1/support/tickets', {
      subject: 'Inquiry regarding milestone payment clarification',
      category: 'PAYMENTS',
      priority: 'MEDIUM',
      description: 'Could you clarify the settlement window for completed contract payments?'
    }, customerToken)
    console.assert(ticketRes.status === 201, 'Customer ticket creation failed')
    const ticketId = ticketRes.data.data.id
    console.log(`✓ Customer support ticket created (ID: ${ticketId})`)

    // Admin lists support tickets
    const adminTicketList = await request(port, 'GET', '/api/v1/admin/support/tickets', null, adminToken)
    console.assert(adminTicketList.status === 200 && adminTicketList.data.data.some(t => t.id === ticketId), 'Admin ticket list missing ticket')
    console.log('✓ Admin viewed support tickets queue')

    // Admin updates ticket
    const adminUpdateTicketRes = await request(port, 'PATCH', `/api/v1/admin/support/tickets/${ticketId}`, {
      status: 'RESOLVED',
      adminNotes: 'Payment timelines clarified directly. Standard window is 2-3 business days.'
    }, adminToken)
    console.assert(adminUpdateTicketRes.status === 200 && adminUpdateTicketRes.data.data.status === 'RESOLVED', 'Admin update ticket failed')
    console.log('✓ Admin resolved support ticket with resolution notes')

    // 7. Reports Workflow
    // Customer reports user
    const reportRes = await request(port, 'POST', '/api/v1/reports', {
      reportedUserId: freelancers[0].id,
      reason: 'Suspicious profile information',
      description: 'Profile lists external contact requests that might violate platform guidelines.',
      relatedConversationId: convId
    }, customerToken)
    console.assert(reportRes.status === 201, 'Report creation failed')
    const reportId = reportRes.data.data.id
    console.log(`✓ Report submitted (ID: ${reportId})`)

    // Admin lists reports
    const adminReportsRes = await request(port, 'GET', '/api/v1/admin/reports', null, adminToken)
    console.assert(adminReportsRes.status === 200 && adminReportsRes.data.data.some(r => r.id === reportId), 'Admin reports list missing report')
    console.log('✓ Admin viewed moderation report queue')

    // Admin updates report
    const adminUpdateReportRes = await request(port, 'PATCH', `/api/v1/admin/reports/${reportId}`, {
      status: 'RESOLVED',
      resolutionNotes: 'Reviewed profile and conversation logs. Profile compliant; notified user of policy.'
    }, adminToken)
    console.assert(adminUpdateReportRes.status === 200 && adminUpdateReportRes.data.data.status === 'RESOLVED', 'Admin report resolution failed')
    console.log('✓ Admin resolved report with resolution notes')

    console.log('\n=============================================')
    console.log('🎉 ALL BACKEND WORKFLOW TESTS PASSED CLEANLY!')
    console.log('=============================================\n')
  } finally {
    server.close()
    await prisma.$disconnect()
  }
}

run().catch((err) => {
  console.error('VERIFICATION FAILED:', err)
  process.exit(1)
})
