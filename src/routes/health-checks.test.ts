import { beforeEach, describe, expect, it } from 'vitest'
import { app } from '../index'

function uniqueId(prefix: string): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

describe('Health Checks API', () => {
  beforeEach(() => {
    Object.assign(process.env, {
      DB_ADAPTER: 'mock',
      DB_DATABASE: `test-${uniqueId('db-')}`,
    })
  })

  describe('POST /health-checks', () => {
    it('should create a health check', async () => {
      // Create an app first
      const appResponse = await app.fetch(
        new Request('http://localhost/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: 'example.com',
            name: 'Example App',
          }),
        })
      )
      const createdApp = await appResponse.json()

      const request = new Request('http://localhost/health-checks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: createdApp.id,
          method: 'GET',
          path: '/health',
        }),
      })

      const response = await app.fetch(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data).toEqual({
        id: expect.any(String),
        appId: createdApp.id,
        method: 'GET',
        path: '/health',
        createdAt: expect.any(Number),
        updatedAt: null,
      })
    })

    it('should return 400 for invalid input', async () => {
      const request = new Request('http://localhost/health-checks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: '',
          method: '',
          path: '',
        }),
      })

      const response = await app.fetch(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data).toEqual({
        error: 'Invalid input',
        details: expect.any(Array),
      })
    })
  })

  describe('GET /health-checks', () => {
    it('should return empty array when no health checks exist', async () => {
      const request = new Request('http://localhost/health-checks')
      const response = await app.fetch(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toEqual([])
    })

    it('should return all health checks', async () => {
      // Create an app first
      const appResponse = await app.fetch(
        new Request('http://localhost/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: 'example.com',
            name: 'Example App',
          }),
        })
      )
      const createdApp = await appResponse.json()

      // Create first health check
      await app.fetch(
        new Request('http://localhost/health-checks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appId: createdApp.id,
            method: 'GET',
            path: '/health',
          }),
        })
      )

      // Create second health check
      await app.fetch(
        new Request('http://localhost/health-checks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appId: createdApp.id,
            method: 'POST',
            path: '/api/status',
          }),
        })
      )

      const request = new Request('http://localhost/health-checks')
      const response = await app.fetch(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toEqual([
        {
          id: expect.any(String),
          appId: createdApp.id,
          method: 'GET',
          path: '/health',
          createdAt: expect.any(Number),
          updatedAt: null,
        },
        {
          id: expect.any(String),
          appId: createdApp.id,
          method: 'POST',
          path: '/api/status',
          createdAt: expect.any(Number),
          updatedAt: null,
        },
      ])
    })
  })

  describe('GET /health-checks/:id', () => {
    it('should return a health check by id', async () => {
      // Create an app first
      const appResponse = await app.fetch(
        new Request('http://localhost/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: 'example.com',
            name: 'Example App',
          }),
        })
      )
      const createdApp = await appResponse.json()

      // Create a health check
      const createResponse = await app.fetch(
        new Request('http://localhost/health-checks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appId: createdApp.id,
            method: 'GET',
            path: '/health',
          }),
        })
      )

      const createdHealthCheck = await createResponse.json()

      // Get the health check
      const request = new Request(
        `http://localhost/health-checks/${createdHealthCheck.id}`
      )
      const response = await app.fetch(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toEqual({
        id: createdHealthCheck.id,
        appId: createdApp.id,
        method: 'GET',
        path: '/health',
        createdAt: expect.any(Number),
        updatedAt: null,
      })
    })

    it('should return 404 for non-existent health check', async () => {
      const request = new Request(
        'http://localhost/health-checks/non-existent-id'
      )
      const response = await app.fetch(request)

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data).toEqual({
        error: 'Health check not found',
      })
    })
  })
})
