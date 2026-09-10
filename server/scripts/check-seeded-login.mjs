import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
try {
  const user = await prisma.user.findUnique({ where: { email: 'shubham@gmail.com' }, select: { id: true, role: true, passwordHash: true } })
  console.log(JSON.stringify({ exists: Boolean(user), id: user?.id, role: user?.role, passwordMatchesSeed: user ? await bcrypt.compare('Password123!', user.passwordHash) : false }))
} finally {
  await prisma.$disconnect()
}
