import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
try {
  const freelancers = await prisma.user.findMany({
    where: { role: 'FREELANCER' },
    select: { id: true, name: true, freelancerProfile: { select: { id: true, userId: true } } },
    orderBy: { id: 'asc' }
  })
  const invalid = freelancers.filter(({ freelancerProfile }) => !freelancerProfile || freelancerProfile.userId === undefined)
  const duplicateProfileIds = freelancers.map(({ freelancerProfile }) => freelancerProfile?.id).filter(Boolean).filter((id, index, ids) => ids.indexOf(id) !== index)
  console.log(JSON.stringify({ freelancerUsers: freelancers.length, profilesAttached: freelancers.filter(({ freelancerProfile }) => Boolean(freelancerProfile)).length, invalid, duplicateProfileIds, sample: freelancers.slice(0, 3) }, null, 2))
} finally {
  await prisma.$disconnect()
}
