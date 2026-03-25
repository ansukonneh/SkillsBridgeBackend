import { describe, it, before } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'
import { app } from '../server.js'
import { init as initDb, getUserByEmail, updateUser } from '../src/db/index.js'

describe('API', () => {
  before(async () => {
    await initDb()
  })

  it('GET /api/health returns 200 and status ok', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect(200)
    assert.strictEqual(res.body.success, true)
    assert.strictEqual(res.body.data?.status, 'ok')
  })

  it('POST /api/auth/register then POST /api/auth/login succeeds', async () => {
    const email = `test-${Date.now()}@example.com`
    const password = 'password123'
    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Test User', email, password })
      .expect(201)

    const user = await getUserByEmail(email)
    assert.ok(user)
    await updateUser(user.id, { emailVerified: true })

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200)
    assert.strictEqual(loginRes.body.success, true)
    assert.ok(loginRes.body.data?.token)
    assert.strictEqual(loginRes.body.data?.user?.email, email)
  })
})
