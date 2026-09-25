import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function clean() {
  const conv17 = await prisma.conversation.findUnique({
    where: { id: 17 },
    include: { participants: { include: { user: true } }, messages: true, reports: true }
  })

  if (conv17) {
    if (conv17.messages.length === 0 && conv17.reports.length === 0) {
      await prisma.conversationParticipant.deleteMany({ where: { conversationId: 17 } })
      await prisma.conversation.delete({ where: { id: 17 } })
      console.log('Conv 17 (invalid freelancer-to-freelancer with 0 messages) safely removed.')
    } else {
      console.log('Conv 17 has messages or reports, cannot delete directly.')
    }
  } else {
    console.log('Conv 17 does not exist.')
  }
}

clean().catch(console.error).finally(() => prisma.$disconnect())
