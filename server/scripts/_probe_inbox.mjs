import dotenv from 'dotenv'
dotenv.config()
import jwt from 'jsonwebtoken'
import http from 'http'
import { PrismaClient } from '@prisma/client'
import app from '../src/app.js'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret-key-change-in-production'
const makeToken = (user) => jwt.sign({ id: user.id, userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' })

const request = (port, method, path, body = null, token = null) => new Promise((resolve, reject) => {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const payload = body ? JSON.stringify(body) : null
  if (payload) headers['Content-Length'] = Buffer.byteLength(payload)
  const req = http.request({ hostname: '127.0.0.1', port, path, method, headers }, (res) => {
    let raw = ''
    res.on('data', (c) => { raw += c })
    res.on('end', () => {
      try { resolve({ status: res.statusCode, data: JSON.parse(raw) }) } catch { resolve({ status: res.statusCode, data: raw }) }
    })
  })
  req.on('error', reject)
  if (payload) req.write(payload)
  req.end()
})

const server = http.createServer(app)
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const port = server.address().port

const shubham = await prisma.user.findFirst({ where: { email: 'shubham@gmail.com' } })
const vedant = await prisma.user.findFirst({ where: { email: 'vedant@gmail.com' } })
const yash = await prisma.user.findFirst({ where: { email: 'yash@gmail.com' } })
console.log({ shubham: shubham && { id: shubham.id, name: shubham.name }, vedant: vedant && { id: vedant.id, name: vedant.name }, yash: yash && { id: yash.id, name: yash.name } })

const summarize = async (label, user) => {
  const token = makeToken(user)
  const res = await request(port, 'GET', '/api/v1/conversations', null, token)
  const list = res.data?.data
  console.log('\n===', label, 'status', res.status, 'count', Array.isArray(list) ? list.length : typeof list, 'msg', res.data?.message)
  if (Array.isArray(list)) {
    for (const c of list) {
      console.log({
        id: c.id,
        customerId: c.customerId,
        freelancerId: c.freelancerId,
        collab1: c.collabFreelancer1Id,
        collab2: c.collabFreelancer2Id,
        counterparty: c.counterparty && { id: c.counterparty.id, name: c.counterparty.name, role: c.counterparty.role },
        preview: c.messages?.[0]?.content?.slice(0, 80)
      })
    }
  } else {
    console.log(JSON.stringify(res.data, null, 2))
  }
}

await summarize('SHUBHAM', shubham)
await summarize('VEDANT', vedant)
await summarize('YASH', yash)

server.close()
await prisma.$disconnect()
