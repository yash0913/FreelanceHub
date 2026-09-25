import dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import http from 'http'
import app from '../src/app.js'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret-key-change-in-production'

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

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
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
    assert(health.status === 200, 'Health check failed')
    console.log('✓ Health check passed')

    // 2. FAQ / Help Center
    const faq = await request(port, 'GET', '/api/v1/help/faq')
    assert(faq.status === 200 && faq.data.totalCategories >= 6, 'FAQ fetch failed')
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

    const conversationCountBefore = await prisma.conversation.count()
    const messageCountBefore = await prisma.message.count()
    console.log(`✓ Data safety baseline: ${conversationCountBefore} conversations, ${messageCountBefore} messages`)

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

    assert(createCollabRes.status === 201, `Create collab failed: ${JSON.stringify(createCollabRes.data)}`)
    const collabId = createCollabRes.data.data.id
    console.log(`✓ Collaboration opportunity created (ID: ${collabId})`)

    // Public lists collaboration
    const listCollabRes = await request(port, 'GET', '/api/v1/collaborations')
    assert(listCollabRes.status === 200 && listCollabRes.data.data.some(c => c.id === collabId), 'Collab list missing created opportunity')
    console.log('✓ Public collaboration listing verified')

    const otherFreelancers = await prisma.user.findMany({
      where: { role: 'FREELANCER', id: { not: freelancers[0].id } }
    })
    let noCollabPeer = null
    for (const peer of otherFreelancers) {
      const existingAccepted = await prisma.collaborationApplication.findFirst({
        where: {
          status: 'ACCEPTED',
          OR: [
            { applicantId: peer.id, opportunity: { creatorId: freelancers[0].id } },
            { applicantId: freelancers[0].id, opportunity: { creatorId: peer.id } }
          ]
        },
        select: { id: true }
      })
      if (!existingAccepted) {
        noCollabPeer = peer
        break
      }
    }
    if (noCollabPeer) {
      const ffNoCollab = await request(port, 'POST', '/api/v1/conversations', {
        participantId: noCollabPeer.id
      }, freelancer1Token)
      assert(ffNoCollab.status === 403, `F↔F without accepted collaboration was allowed: ${JSON.stringify(ffNoCollab.data)}`)
      console.log(`✓ F↔F messaging rejected without an accepted collaboration (peer #${noCollabPeer.id})`)
    } else {
      console.log('✓ F↔F without-collaboration test skipped (every freelancer pair already has an accepted collab)')
    }

    // Freelancer 2 applies to the collaboration
    const applyRes = await request(port, 'POST', `/api/v1/collaborations/${collabId}/apply`, {
      message: 'I have experience building React components and want to gain verified collaborative experience on real dashboards.'
    }, freelancer2Token)

    assert(applyRes.status === 201, `Apply collab failed: ${JSON.stringify(applyRes.data)}`)
    const appId = applyRes.data.data.id
    console.log(`✓ Freelancer applied to collaboration (App ID: ${appId})`)

    // Freelancer 1 lists applications and accepts Freelancer 2
    const acceptRes = await request(port, 'PATCH', `/api/v1/collaborations/applications/${appId}`, {
      status: 'ACCEPTED'
    }, freelancer1Token)

    assert(acceptRes.status === 200 && acceptRes.data.data.status === 'ACCEPTED', 'Accepting application failed')
    console.log('✓ Creator accepted collaborator application')

    const selfMsg = await request(port, 'POST', '/api/v1/conversations', {
      participantId: freelancers[0].id
    }, freelancer1Token)
    assert(selfMsg.status === 400, `Self-messaging was not rejected: ${JSON.stringify(selfMsg.data)}`)
    console.log('✓ Self-messaging rejected')

    const customers = await prisma.user.findMany({ where: { role: 'CUSTOMER' }, take: 2 })
    if (customers.length >= 2) {
      const ccRes = await request(port, 'POST', '/api/v1/conversations', {
        participantId: customers[1].id
      }, makeToken(customers[0]))
      assert(ccRes.status === 400, `Customer↔Customer messaging was not rejected: ${JSON.stringify(ccRes.data)}`)
      console.log('✓ Customer↔Customer messaging rejected')
    } else {
      console.log('✓ Customer↔Customer test skipped (only one customer in database)')
    }

    const adminInbox = await request(port, 'GET', '/api/v1/conversations', null, adminToken)
    assert(adminInbox.status === 200 && Array.isArray(adminInbox.data.data) && adminInbox.data.data.length === 0, 'Admin inbox should be empty')
    console.log('✓ Admin has no direct-message inbox')

    // F↔F conversation after accepted collaboration (no frontend collaborationMode flag)
    const ffStart = await request(port, 'POST', '/api/v1/conversations', {
      participantId: freelancers[1].id
    }, freelancer1Token)
    assert(ffStart.status === 200, `F↔F start failed: ${JSON.stringify(ffStart.data)}`)
    const ffConvId = ffStart.data.data.id
    assert(ffStart.data.data.counterparty?.id === freelancers[1].id, 'F↔F counterparty for freelancer 1 should be freelancer 2')
    assert(ffStart.data.data.counterparty?.id !== freelancers[0].id, 'F↔F must not show the caller as counterparty')
    console.log(`✓ F↔F collaboration conversation ready (ID: ${ffConvId}), freelancer 1 sees ${ffStart.data.data.counterparty?.name}`)

    const ffStartAgain = await request(port, 'POST', '/api/v1/conversations', {
      participantId: freelancers[1].id
    }, freelancer1Token)
    assert(ffStartAgain.data.data.id === ffConvId, 'Duplicate F↔F conversation was created')
    console.log('✓ Repeated F↔F start reused the same conversation')

    const ffInbox1 = await request(port, 'GET', '/api/v1/conversations', null, freelancer1Token)
    const ffRow1 = (ffInbox1.data.data || []).filter((c) => c.id === ffConvId)
    assert(ffRow1.length === 1, 'F↔F conversation missing or duplicated in freelancer 1 inbox')
    assert(ffRow1[0].counterparty?.id === freelancers[1].id, 'Freelancer 1 inbox row must show freelancer 2')
    console.log(`✓ Freelancer 1 inbox shows ${ffRow1[0].counterparty?.name}`)

    const ffInbox2 = await request(port, 'GET', '/api/v1/conversations', null, freelancer2Token)
    const ffRow2 = (ffInbox2.data.data || []).filter((c) => c.id === ffConvId)
    assert(ffRow2.length === 1, 'F↔F conversation missing or duplicated in freelancer 2 inbox')
    assert(ffRow2[0].counterparty?.id === freelancers[0].id, 'Freelancer 2 inbox row must show freelancer 1')
    console.log(`✓ Freelancer 2 inbox shows ${ffRow2[0].counterparty?.name}`)

    await request(port, 'POST', `/api/v1/conversations/${ffConvId}/messages`, {
      content: 'Can you help with the React frontend portion?'
    }, freelancer1Token)
    await request(port, 'POST', `/api/v1/conversations/${ffConvId}/messages`, {
      content: 'Yes, I can assist with that.'
    }, freelancer2Token)
    const ffMsgs = await request(port, 'GET', `/api/v1/conversations/${ffConvId}/messages`, null, freelancer2Token)
    assert(ffMsgs.status === 200 && ffMsgs.data.data.length >= 2, 'F↔F message history did not persist')
    const ffInboxAfter = await request(port, 'GET', '/api/v1/conversations', null, freelancer1Token)
    const ffRowsAfter = (ffInboxAfter.data.data || []).filter((c) => c.id === ffConvId)
    assert(ffRowsAfter.length === 1, 'Sending a second F↔F message created a duplicate inbox row')
    console.log('✓ F↔F messages persist and remain a single inbox row')

    // Freelancer 1 completes collaboration -> triggers verified work history creation
    const completeRes = await request(port, 'POST', `/api/v1/collaborations/${collabId}/complete`, {}, freelancer1Token)
    assert(completeRes.status === 200, `Complete collab failed: ${JSON.stringify(completeRes.data)}`)
    console.log('✓ Collaboration marked COMPLETED by owner')

    // Verify VerifiedCollaboration was created
    const verifiedListRes = await request(port, 'GET', `/api/v1/freelancers/${freelancers[1].id}/verified-collaborations`)
    assert(verifiedListRes.status === 200 && verifiedListRes.data.data.length > 0, 'Verified collaboration not found in profile history')
    console.log(`✓ Verified work experience confirmed for Freelancer #${freelancers[1].id}: "${verifiedListRes.data.data[0].projectTitle}" (Role: ${verifiedListRes.data.data[0].role})`)

    // 5. Messaging Workflow
    // Customer starts conversation with Freelancer 1
    const startConvRes = await request(port, 'POST', '/api/v1/conversations', {
      participantId: freelancers[0].id
    }, customerToken)
    assert(startConvRes.status === 200 || startConvRes.status === 201, `Start conv failed: ${JSON.stringify(startConvRes.data)}`)
    const convId = startConvRes.data.data.id
    console.log(`✓ Customer <-> Freelancer conversation established (ID: ${convId})`)

    // Customer sends message
    const sendMsgRes = await request(port, 'POST', `/api/v1/conversations/${convId}/messages`, {
      content: 'Hello! I noticed your profile and wanted to discuss a project.'
    }, customerToken)
    assert(sendMsgRes.status === 201, 'Send message failed')
    console.log('✓ Customer sent message')

    // Freelancer 1 reads messages
    const listMsgRes = await request(port, 'GET', `/api/v1/conversations/${convId}/messages`, null, freelancer1Token)
    assert(listMsgRes.status === 200 && listMsgRes.data.data.length > 0, 'List messages failed')
    console.log(`✓ Freelancer received message: "${listMsgRes.data.data[0].content}"`)

    // Freelancer 2 (unauthorized) tries to read conversation
    const unauthRes = await request(port, 'GET', `/api/v1/conversations/${convId}/messages`, null, freelancer2Token)
    assert(unauthRes.status === 404, 'Security failure: Unauthorized user accessed private conversation')
    console.log('✓ Security verified: Unauthorized user cannot read conversation')

    // Direct chat with admin is rejected
    const adminChatRes = await request(port, 'POST', '/api/v1/conversations', {
      participantId: adminUser.id
    }, customerToken)
    assert(adminChatRes.status === 403, 'Security failure: Direct chat with Admin was not blocked')
    console.log('✓ Security verified: Direct chat with Admin forbidden (use Support Tickets instead)')

    const customerInbox = await request(port, 'GET', '/api/v1/conversations', null, customerToken)
    const customerRows = (customerInbox.data.data || []).filter((c) => c.id === convId)
    assert(customerRows.length === 1, 'Customer inbox missing C↔F conversation after GET /conversations')
    assert(customerRows[0].counterparty?.id === freelancers[0].id, 'Customer must see the freelancer as counterparty')
    assert(customerRows[0].counterparty?.id !== customerUser.id, 'Customer must not see themselves as counterparty')
    console.log(`✓ Customer inbox persisted; counterparty is ${customerRows[0].counterparty?.name}`)

    const freelancerCfInbox = await request(port, 'GET', '/api/v1/conversations', null, freelancer1Token)
    const freelancerCfRows = (freelancerCfInbox.data.data || []).filter((c) => c.id === convId)
    assert(freelancerCfRows.length === 1, 'Freelancer inbox missing C↔F conversation')
    assert(freelancerCfRows[0].counterparty?.id === customerUser.id, 'Freelancer must see the customer as counterparty')
    console.log(`✓ Freelancer C↔F inbox persisted; counterparty is ${freelancerCfRows[0].counterparty?.name}`)

    const sendMsg2 = await request(port, 'POST', `/api/v1/conversations/${convId}/messages`, {
      content: 'Following up on the previous note.'
    }, customerToken)
    assert(sendMsg2.status === 201, 'Second C↔F message failed')
    const customerInboxAfter = await request(port, 'GET', '/api/v1/conversations', null, customerToken)
    const customerRowsAfter = (customerInboxAfter.data.data || []).filter((c) => c.id === convId)
    assert(customerRowsAfter.length === 1, 'Second message created a duplicate C↔F inbox row')
    const history = await request(port, 'GET', `/api/v1/conversations/${convId}/messages`, null, customerToken)
    assert(history.data.data.length >= 2, 'C↔F message history did not load completely')
    console.log('✓ C↔F history loads fully and stays a single inbox row')

    const conversationCountAfter = await prisma.conversation.count()
    const messageCountAfter = await prisma.message.count()
    assert(conversationCountAfter >= conversationCountBefore, 'Conversation records were deleted during verification')
    assert(messageCountAfter >= messageCountBefore, 'Message records were deleted during verification')
    console.log(`✓ Data safety: conversations ${conversationCountBefore} → ${conversationCountAfter}, messages ${messageCountBefore} → ${messageCountAfter} (no deletions)`)

    // 6. Support Tickets Workflow
    // Customer files support ticket
    const ticketRes = await request(port, 'POST', '/api/v1/support/tickets', {
      subject: 'Inquiry regarding milestone payment clarification',
      category: 'PAYMENTS',
      priority: 'MEDIUM',
      description: 'Could you clarify the settlement window for completed contract payments?'
    }, customerToken)
    assert(ticketRes.status === 201, 'Customer ticket creation failed')
    const ticketId = ticketRes.data.data.id
    console.log(`✓ Customer support ticket created (ID: ${ticketId})`)

    // Admin lists support tickets
    const adminTicketList = await request(port, 'GET', '/api/v1/admin/support/tickets', null, adminToken)
    assert(adminTicketList.status === 200 && adminTicketList.data.data.some(t => t.id === ticketId), 'Admin ticket list missing ticket')
    console.log('✓ Admin viewed support tickets queue')

    // Admin updates ticket
    const adminUpdateTicketRes = await request(port, 'PATCH', `/api/v1/admin/support/tickets/${ticketId}`, {
      status: 'RESOLVED',
      adminNotes: 'Payment timelines clarified directly. Standard window is 2-3 business days.'
    }, adminToken)
    assert(adminUpdateTicketRes.status === 200 && adminUpdateTicketRes.data.data.status === 'RESOLVED', 'Admin update ticket failed')
    console.log('✓ Admin resolved support ticket with resolution notes')

    // 7. Reports Workflow
    // Customer reports user
    const reportRes = await request(port, 'POST', '/api/v1/reports', {
      reportedUserId: freelancers[0].id,
      reason: 'Suspicious profile information',
      description: 'Profile lists external contact requests that might violate platform guidelines.',
      relatedConversationId: convId
    }, customerToken)
    assert(reportRes.status === 201, 'Report creation failed')
    const reportId = reportRes.data.data.id
    console.log(`✓ Report submitted (ID: ${reportId})`)

    // Admin lists reports
    const adminReportsRes = await request(port, 'GET', '/api/v1/admin/reports', null, adminToken)
    assert(adminReportsRes.status === 200 && adminReportsRes.data.data.some(r => r.id === reportId), 'Admin reports list missing report')
    console.log('✓ Admin viewed moderation report queue')

    // Admin updates report
    const adminUpdateReportRes = await request(port, 'PATCH', `/api/v1/admin/reports/${reportId}`, {
      status: 'RESOLVED',
      resolutionNotes: 'Reviewed profile and conversation logs. Profile compliant; notified user of policy.'
    }, adminToken)
    assert(adminUpdateReportRes.status === 200 && adminUpdateReportRes.data.data.status === 'RESOLVED', 'Admin report resolution failed')
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
