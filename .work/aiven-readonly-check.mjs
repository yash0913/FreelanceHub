import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(resolve(process.cwd(), 'package.json'))
require('dotenv').config({ path: resolve(process.cwd(), '.env') })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
try {
  const columns = await prisma.$queryRaw`
    SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND ((TABLE_NAME = 'User' AND COLUMN_NAME = 'isProfileCompleted')
        OR (TABLE_NAME = 'CustomerProfile' AND COLUMN_NAME IN ('organizationType', 'useCase', 'website', 'linkedinUrl'))
        OR (TABLE_NAME = 'FreelancerProfile' AND COLUMN_NAME IN ('linkedinUrl', 'githubUrl', 'websiteUrl', 'yearsOfExperience', 'experienceSummary')))
    ORDER BY TABLE_NAME, COLUMN_NAME
  `
  const tables = await prisma.$queryRaw`
    SELECT TABLE_NAME AS tableName
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('Certification', 'ProjectProgressUpdate', 'Notification')
    ORDER BY TABLE_NAME
  `
  const migrationTable = await prisma.$queryRaw`
    SELECT TABLE_NAME AS tableName
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '_prisma_migrations'
  `
  let migration = null
  if (migrationTable.length) {
    const rows = await prisma.$queryRaw`
      SELECT migration_name AS migrationName, finished_at AS finishedAt, rolled_back_at AS rolledBackAt
      FROM _prisma_migrations
      WHERE migration_name = '20261004194500_add_profile_setup_and_progress_tracker'
      ORDER BY started_at DESC
      LIMIT 1
    `
    migration = rows[0] ?? null
  }
  const expectedColumns = {
    User: ['isProfileCompleted'],
    CustomerProfile: ['organizationType', 'useCase', 'website', 'linkedinUrl'],
    FreelancerProfile: ['linkedinUrl', 'githubUrl', 'websiteUrl', 'yearsOfExperience', 'experienceSummary'],
  }
  const found = new Set(columns.map(({ tableName, columnName }) => `${tableName}.${columnName}`))
  const missingColumns = Object.entries(expectedColumns).flatMap(([table, names]) => names.filter((name) => !found.has(`${table}.${name}`)).map((name) => `${table}.${name}`))
  const foundTables = new Set(tables.map(({ tableName }) => tableName))
  const missingTables = ['Certification', 'ProjectProgressUpdate', 'Notification'].filter((name) => !foundTables.has(name))
  const applied = Boolean(migration?.finishedAt && !migration?.rolledBackAt)
  console.log(JSON.stringify({
    missingColumns,
    missingTables,
    migrationTableExists: migrationTable.length > 0,
    migration,
    migrationApplied: applied,
    schemaComplete: missingColumns.length === 0 && missingTables.length === 0,
  }, (_, value) => value instanceof Date ? value.toISOString() : value, 2))
} catch (error) {
  console.error(JSON.stringify({ databaseCheck: 'FAILED', code: error?.code ?? null, message: 'Read-only database inspection could not be completed; connection details suppressed.' }))
  process.exitCode = 2
} finally {
  await prisma.$disconnect()
}
