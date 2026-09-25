import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const convs = await p.conversation.findMany({
  include: {
    participants: { include: { user: { select: { id: true, name: true, role: true } } } },
    _count: { select: { messages: true } }
  },
  orderBy: { id: 'desc' },
  take: 30
})
console.log(JSON.stringify(convs.map((c) => ({
  id: c.id,
  customerId: c.customerId,
  freelancerId: c.freelancerId,
  collab1: c.collabFreelancer1Id,
  collab2: c.collabFreelancer2Id,
  msgs: c._count.messages,
  participants: c.participants.map((x) => ({ userId: x.userId, name: x.user?.name, role: x.user?.role }))
})), null, 2))
console.log('total', await p.conversation.count())
const users = await p.user.findMany({
  where: { OR: [{ name: { contains: 'Shubham' } }, { name: { contains: 'Vedant' } }, { name: { contains: 'Yash' } }] },
  select: { id: true, name: true, role: true, email: true }
})
console.log('named users', users)
await p.$disconnect()
