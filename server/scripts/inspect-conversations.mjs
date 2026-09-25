import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const convs = await prisma.conversation.findMany({
    include: {
      participants: { include: { user: { select: { id: true, name: true, role: true } } } },
      messages: { select: { id: true, senderId: true, content: true } }
    }
  })
  console.log('Total conversations in DB:', convs.length)
  const pairs = new Map()

  for (const c of convs) {
    const userIds = c.participants.map(p => p.userId).sort((a, b) => a - b)
    const pairKey = userIds.join('_')
    const roles = c.participants.map(p => p.user.role)

    if (!pairs.has(pairKey)) {
      pairs.set(pairKey, [])
    }
    pairs.get(pairKey).push(c)

    const isSelf = c.participants.length < 2 || (c.participants.length === 2 && userIds[0] === userIds[1])
    const hasAdmin = roles.includes('ADMIN')
    const isBothCustomer = roles.length === 2 && roles[0] === 'CUSTOMER' && roles[1] === 'CUSTOMER'
    const isBothFreelancer = roles.length === 2 && roles[0] === 'FREELANCER' && roles[1] === 'FREELANCER'

    if (isSelf || hasAdmin || isBothCustomer || isBothFreelancer) {
      console.log(`[INVALID CONV] #${c.id}: isSelf=${isSelf}, hasAdmin=${hasAdmin}, isBothCustomer=${isBothCustomer}, isBothFreelancer=${isBothFreelancer}. Users:`, c.participants.map(p => `${p.user.name} (${p.user.id}, ${p.user.role})`))
    }
  }

  for (const [key, list] of pairs.entries()) {
    if (list.length > 1) {
      console.log(`[DUPLICATE PAIR] Key: ${key}, Found ${list.length} conversations:`, list.map(c => `Conv #${c.id} (${c.messages.length} msgs)`))
    }
  }

  console.log('Audit complete.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
