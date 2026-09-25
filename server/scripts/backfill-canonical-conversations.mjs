import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function backfill() {
  console.log('--- Starting Backfill of Canonical Conversations ---')
  const convs = await prisma.conversation.findMany({
    include: {
      participants: {
        include: { user: { select: { id: true, role: true, name: true } } }
      },
      messages: true
    }
  })

  console.log(`Found ${convs.length} total conversations to process.`)

  const pairToCanonical = new Map()

  for (const conv of convs) {
    const customerParticipant = conv.participants.find(p => p.user.role === 'CUSTOMER')
    const freelancerParticipant = conv.participants.find(p => p.user.role === 'FREELANCER')

    if (!customerParticipant || !freelancerParticipant || customerParticipant.userId === freelancerParticipant.userId) {
      console.log(`[SKIPPING / CLEANING INVALID] Conv #${conv.id}: Missing customer or freelancer. Participants:`, conv.participants.map(p => `${p.user.name} (${p.user.role})`))
      if (conv.messages.length === 0) {
        await prisma.conversationParticipant.deleteMany({ where: { conversationId: conv.id } })
        await prisma.conversation.delete({ where: { id: conv.id } })
        console.log(`Deleted empty invalid Conv #${conv.id}`)
      }
      continue
    }

    const cId = customerParticipant.userId
    const fId = freelancerParticipant.userId
    const pairKey = `${cId}_${fId}`

    if (!pairToCanonical.has(pairKey)) {
      // First conversation for this pair is canonical
      await prisma.conversation.update({
        where: { id: conv.id },
        data: { customerId: cId, freelancerId: fId }
      })
      pairToCanonical.set(pairKey, conv.id)
      console.log(`✓ Set Conv #${conv.id} as canonical for Customer #${cId} + Freelancer #${fId}`)
    } else {
      // Duplicate conversation exists! Consolidate messages into the canonical conversation
      const canonicalId = pairToCanonical.get(pairKey)
      console.log(`Consolidating duplicate Conv #${conv.id} into canonical Conv #${canonicalId}...`)

      // Move messages to canonical conversation
      if (conv.messages.length > 0) {
        await prisma.message.updateMany({
          where: { conversationId: conv.id },
          data: { conversationId: canonicalId }
        })
        console.log(`Moved ${conv.messages.length} messages from Conv #${conv.id} to Conv #${canonicalId}`)
      }

      // Update any reports pointing to duplicate conv
      await prisma.report.updateMany({
        where: { relatedConversationId: conv.id },
        data: { relatedConversationId: canonicalId }
      })

      // Delete duplicate conversation participants and conversation
      await prisma.conversationParticipant.deleteMany({ where: { conversationId: conv.id } })
      await prisma.conversation.delete({ where: { id: conv.id } })
      console.log(`✓ Cleaned up duplicate Conv #${conv.id}`)
    }
  }

  console.log('--- Backfill Completed Successfully ---')
}

backfill()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
