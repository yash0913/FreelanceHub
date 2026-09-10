import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const models = [
  ['User', prisma.user],
  ['CustomerProfile', prisma.customerProfile],
  ['FreelancerProfile', prisma.freelancerProfile],
  ['Skill', prisma.skill],
  ['FreelancerSkill', prisma.freelancerSkill],
  ['Category', prisma.category],
  ['Project', prisma.project],
  ['ProjectSkill', prisma.projectSkill],
  ['PortfolioProject', prisma.portfolioProject],
  ['PortfolioProjectSkill', prisma.portfolioProjectSkill],
  ['Proposal', prisma.proposal],
  ['Contract', prisma.contract],
  ['Message', prisma.message],
  ['Review', prisma.review],
  ['Report', prisma.report],
  ['Payment', prisma.payment]
]

try {
  const counts = {}
  for (const [name, model] of models) counts[name] = await model.count()
  console.log(JSON.stringify(counts, null, 2))
} finally {
  await prisma.$disconnect()
}
