import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'

const require = createRequire(resolve(process.cwd(), 'package.json'))
const { Prisma, PrismaClient } = require('@prisma/client')
const models = Prisma.dmmf.datamodel.models
const required = {
  User: ['isProfileCompleted'],
  FreelancerProfile: ['certifications'],
  Certification: [],
  Notification: [],
  ProjectProgressUpdate: [],
}
for (const [name, fields] of Object.entries(required)) {
  const model = models.find((item) => item.name === name)
  if (!model) throw new Error(`Generated Prisma model missing: ${name}`)
  for (const field of fields) {
    if (!model.fields.some((item) => item.name === field)) {
      throw new Error(`Generated Prisma field missing: ${name}.${field}`)
    }
  }
  console.log(`${name}: OK${fields.length ? ` (${fields.join(', ')})` : ''}`)
}

const prisma = new PrismaClient()
for (const delegate of ['notification', 'projectProgressUpdate', 'certification']) {
  if (typeof prisma[delegate]?.findMany !== 'function') {
    throw new Error(`Generated Prisma delegate missing: ${delegate}`)
  }
}
const clientPackage = JSON.parse(readFileSync(resolve(process.cwd(), 'node_modules/@prisma/client/package.json'), 'utf8'))
const cliPackage = JSON.parse(readFileSync(resolve(process.cwd(), 'node_modules/prisma/package.json'), 'utf8'))
console.log(`Prisma versions: client=${clientPackage.version}, cli=${cliPackage.version}`)
console.log('Notification, projectProgressUpdate, certification delegates: OK')
await prisma.$disconnect()
