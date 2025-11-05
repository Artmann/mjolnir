import { beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '../api'

function uniqueId(prefix: string): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

describe('Health Checks API', () => {
  beforeEach(() => {
    Object.assign(process.env, {
      DB_ADAPTER: 'mock',
      DB_DATABASE: `test-${uniqueId('db-')}`
    })
  })

  describe('POST /health-checks', () => {
    it('should create a health check', async () => {
      // Create an app first
      const appResponse = await app.fetch(
        new Request('http://localhost/api/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: 'example.com',
            name: 'Example App'
          })
        })
      )
      const createdAppData = (await appResponse.json()) as any
      const createdApp = createdAppData.app

      const request = new Request('http://localhost/api/health-checks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appId: createdApp.id,
          method: 'GET',
          path: '/health'
        })
      })

      const response = await app.fetch(request)

      expect(response.status).toEqual(201)

      const data = (await response.json()) as any

      expect(data).toEqual({
        healthCheck: {
          id: expect.any(String),
          appId: createdApp.id,
          method: 'GET',
          path: '/health',
          createdAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
          ),
          updatedAt: null
        }
      })
    })

    it('should return timestamps as ISO strings', async () => {
      const fixedDate = new Date('2024-01-15T10:30:45.123Z')
      vi.spyOn(global.Date, 'now').mockReturnValue(fixedDate.getTime())

      // Create an app first
      const appResponse = await app.fetch(
        new Request('http://localhost/api/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: 'example.com',
            name: 'Example App'
          })
        })
      )
      const createdAppData = (await appResponse.json()) as any
      const createdApp = createdAppData.app

      const request = new Request('http://localhost/api/health-checks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appId: createdApp.id,
          method: 'GET',
          path: '/health'
        })
      })

      const response = await app.fetch(request)

      expect(response.status).toEqual(201)

      const data = (await response.json()) as any

      expect(data.healthCheck.createdAt).toEqual('2024-01-15T10:30:45.123Z')
      expect(data.healthCheck.updatedAt).toEqual(null)

      vi.restoreAllMocks()
    })

    it('should return 400 for invalid input', async () => {
      const request = new Request('http://localhost/api/health-checks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appId: '',
          path: ''
        })
      })

      const response = await app.fetch(request)

      expect(response.status).toEqual(400)

      const data = (await response.json()) as any

      expect(data).toEqual({
        error: {
          message: 'Validation error',
          details: {
            appId: 'Too small: expected string to have >=1 characters.',
            path: 'Too small: expected string to have >=1 characters.'
          }
        }
      })
    })
  })

  describe('GET /health-checks', () => {
    it('should return empty array when no health checks exist', async () => {
      const request = new Request('http://localhost/api/health-checks')
      const response = await app.fetch(request)

      expect(response.status).toEqual(200)

      const data = (await response.json()) as any

      expect(data).toEqual({ healthChecks: [] })
    })

    it('should return all health checks', async () => {
      // Create an app first
      const appResponse = await app.fetch(
        new Request('http://localhost/api/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: 'example.com',
            name: 'Example App'
          })
        })
      )
      const createdAppData = (await appResponse.json()) as any
      const createdApp = createdAppData.app

      // Create first health check
      await app.fetch(
        new Request('http://localhost/api/health-checks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appId: createdApp.id,
            method: 'GET',
            path: '/health'
          })
        })
      )

      // Create second health check
      await app.fetch(
        new Request('http://localhost/api/health-checks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appId: createdApp.id,
            method: 'POST',
            path: '/api/status'
          })
        })
      )

      const request = new Request('http://localhost/api/health-checks')
      const response = await app.fetch(request)

      expect(response.status).toEqual(200)

      const data = (await response.json()) as any

      expect(data).toEqual({
        healthChecks: [
          {
            id: expect.any(String),
            appId: createdApp.id,
            method: 'GET',
            path: '/health',
            createdAt: expect.stringMatching(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
            ),
            updatedAt: null
          },
          {
            id: expect.any(String),
            appId: createdApp.id,
            method: 'POST',
            path: '/api/status',
            createdAt: expect.stringMatching(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
            ),
            updatedAt: null
          }
        ]
      })
    })
  })

  describe('GET /health-checks/:id', () => {
    it('should return a health check by id', async () => {
      // Create an app first
      const appResponse = await app.fetch(
        new Request('http://localhost/api/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: 'example.com',
            name: 'Example App'
          })
        })
      )
      const createdAppData = (await appResponse.json()) as any
      const createdApp = createdAppData.app

      // Create a health check
      const createResponse = await app.fetch(
        new Request('http://localhost/api/health-checks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appId: createdApp.id,
            method: 'GET',
            path: '/health'
          })
        })
      )

      const createdHealthCheckData = (await createResponse.json()) as any
      const createdHealthCheck = createdHealthCheckData.healthCheck

      // Get the health check
      const request = new Request(
        `http://localhost/api/health-checks/${createdHealthCheck.id}`
      )
      const response = await app.fetch(request)

      expect(response.status).toEqual(200)

      const data = (await response.json()) as any

      expect(data).toEqual({
        healthCheck: {
          id: createdHealthCheck.id,
          appId: createdApp.id,
          method: 'GET',
          path: '/health',
          createdAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
          ),
          updatedAt: null
        }
      })
    })

    it('should return 404 for non-existent health check', async () => {
      const request = new Request(
        'http://localhost/api/health-checks/non-existent-id'
      )
      const response = await app.fetch(request)

      expect(response.status).toEqual(404)

      const data = (await response.json()) as any

      expect(data).toEqual({
        error: {
          message: 'Health check not found.'
        }
      })
    })
  })

  describe('POST /health-checks - defaults and validation', () => {
    it('should default method to GET when not provided', async () => {
      // Create an app first
      const appResponse = await app.fetch(
        new Request('http://localhost/api/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: 'example.com',
            name: 'Example App'
          })
        })
      )
      const createdAppData = (await appResponse.json()) as any
      const createdApp = createdAppData.app

      const request = new Request('http://localhost/api/health-checks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appId: createdApp.id,
          path: '/health'
        })
      })

      const response = await app.fetch(request)

      expect(response.status).toEqual(201)

      const data = (await response.json()) as any

      expect(data.healthCheck.method).toEqual('GET')
    })

    it('should return 400 when app does not exist', async () => {
      const request = new Request('http://localhost/api/health-checks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appId: 'non-existent-app-id',
          method: 'GET',
          path: '/health'
        })
      })

      const response = await app.fetch(request)

      expect(response.status).toEqual(400)

      const data = (await response.json()) as any

      expect(data).toEqual({
        error: {
          message: "The app doesn't exist."
        }
      })
    })
  })
})
