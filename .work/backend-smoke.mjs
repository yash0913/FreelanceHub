import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { resolve } from 'node:path'

const serverDir = resolve(process.cwd(), 'server')
const port = 5187
const child = spawn(process.execPath, ['src/server.js'], {
  cwd: serverDir,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let stdout = ''
let stderr = ''
let lastError = ''
child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk })
child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk })
const base = `http://127.0.0.1:${port}`
try {
  let health
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Backend exited with ${child.exitCode}`)
    try {
      const response = await fetch(`${base}/api/v1/health`)
      if (response.ok) health = await response.json()
      if (health) break
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = `${error.message}${error.cause?.code ? ` (${error.cause.code})` : ''}`
    }
    await delay(500)
  }
  if (!health) throw new Error(`Backend health endpoint did not become ready; last local request error: ${lastError}`)
  console.log(`Startup + health: HTTP 200; status=${health.status}`)

  for (const route of ['/api/v1/auth/me', '/api/v1/profile', '/api/v1/contracts/mine', '/api/v1/conversations', '/api/v1/notifications', '/api/v1/payments/mine']) {
    const response = await fetch(`${base}${route}`)
    if (response.status !== 401) throw new Error(`${route}: expected 401 without token, got ${response.status}`)
    console.log(`Route guard: ${route} -> ${response.status}`)
  }
  const login = await fetch(`${base}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  })
  if (login.status !== 400) throw new Error(`Empty login request expected 400, got ${login.status}`)
  console.log('Login route validation: POST /api/v1/auth/login with empty body -> 400 (no database query)')
} catch (error) {
  console.error(`${error.message}\nBackend stdout: ${stdout.trim()}\nBackend stderr: ${stderr.trim()}`)
  process.exitCode = 1
} finally {
  child.kill()
}
