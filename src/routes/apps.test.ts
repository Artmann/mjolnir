import { beforeEach, describe, expect, it } from 'vitest'
import { app } from '../index'

function uniqueId(prefix: string): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

describe('Apps API', () => {
  beforeEach(() => {
    Object.assign(process.env, {
      DB_ADAPTER: 'mock',
      DB_DATABASE: `test-${uniqueId('db-')}`,
    })
  })

  describe('POST /apps', () => {
    it('should create an app', async () => {
      const req = new Request('http://localhost/apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: 'example.com',
          name: 'Example App',
        }),
      })

      const res = await app.fetch(req)
      expect(res.status).toBe(201)

      const data = await res.json()
      expect(data).toEqual({
        id: expect.any(String),
        domain: 'example.com',
        name: 'Example App',
        createdAt: expect.any(Number),
        updatedAt: null,
      })
    })

    it('should return 400 for invalid input', async () => {
      const req = new Request('http://localhost/apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: '',
          name: '',
        }),
      })

      const res = await app.fetch(req)
      expect(res.status).toBe(400)

      const data = await res.json()
      expect(data).toEqual({
        error: 'Invalid input',
        details: expect.any(Array),
      })
    })
  })

  describe('GET /apps', () => {
    it('should return empty array when no apps exist', async () => {
      const req = new Request('http://localhost/apps')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toEqual([])
    })

    it('should return all apps', async () => {
      // Create first app
      await app.fetch(
        new Request('http://localhost/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: 'example.com',
            name: 'Example App',
          }),
        })
      )

      // Create second app
      await app.fetch(
        new Request('http://localhost/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: 'test.com',
            name: 'Test App',
          }),
        })
      )

      const req = new Request('http://localhost/apps')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toEqual([
        {
          id: expect.any(String),
          domain: 'example.com',
          name: 'Example App',
          createdAt: expect.any(Number),
          updatedAt: null,
        },
        {
          id: expect.any(String),
          domain: 'test.com',
          name: 'Test App',
          createdAt: expect.any(Number),
          updatedAt: null,
        },
      ])
    })
  })

  describe('GET /apps/:id', () => {
    it('should return an app by id', async () => {
      // Create an app
      const createRes = await app.fetch(
        new Request('http://localhost/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: 'example.com',
            name: 'Example App',
          }),
        })
      )

      const createdApp = await createRes.json()

      // Get the app
      const req = new Request(`http://localhost/apps/${createdApp.id}`)
      const res = await app.fetch(req)

      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toEqual({
        id: createdApp.id,
        domain: 'example.com',
        name: 'Example App',
        createdAt: expect.any(Number),
        updatedAt: null,
      })
    })

    it('should return 404 for non-existent app', async () => {
      const req = new Request('http://localhost/apps/non-existent-id')
      const res = await app.fetch(req)

      expect(res.status).toBe(404)

      const data = await res.json()
      expect(data).toEqual({
        error: 'App not found',
      })
    })
  })
})
