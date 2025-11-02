import { describe, expect, it } from 'vitest'
import app from './index'

describe('API', () => {
  it('should return welcome message on root route', async () => {
    const req = new Request('http://localhost/')
    const res = await app.fetch(req)

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('message')
    expect(data).toHaveProperty('version')
    expect(data.message).toBe(
      'Welcome to Mjolnir - Application Health Checks API'
    )
    expect(data.version).toBe('1.0.0')
  })

  it('should return JSON content type', async () => {
    const req = new Request('http://localhost/')
    const res = await app.fetch(req)

    expect(res.headers.get('content-type')).toContain('application/json')
  })
})
