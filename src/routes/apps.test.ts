import { beforeEach, describe, expect, it } from 'vitest'
import { app } from '../index'

function uniqueId(prefix: string): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

describe('Apps API', () => {
  beforeEach(() => {
    Object.assign(process.env, {
      DB_ADAPTER: 'mock',
      DB_DATABASE: `test-${uniqueId('db-')}`
    })
  })

  describe('POST /apps', () => {
    it('should create an app', async () => {
      const request = new Request('http://localhost/apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domain: 'example.com',
          name: 'Example App'
        })
      })

      const response = await app.fetch(request)
      expect(response.status).toBe(201)

      const data = (await response.json()) as any
      expect(data).toEqual({
        app: {
          id: expect.any(String),
          domain: 'example.com',
          name: 'Example App',
          createdAt: expect.any(Number),
          updatedAt: null
        }
      })
    })

    it('should return 400 for invalid input', async () => {
      const request = new Request('http://localhost/apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domain: '',
          name: ''
        })
      })

      const response = await app.fetch(request)
      expect(response.status).toBe(400)

      const data = (await response.json()) as any
      expect(data).toEqual({
        error: {
          message: 'Invalid input',
          details: expect.any(Array)
        }
      })
    })
  })

  describe('GET /apps', () => {
    it('should return empty array when no apps exist', async () => {
      const request = new Request('http://localhost/apps')
      const response = await app.fetch(request)

      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data).toEqual({ apps: [] })
    })

    it('should return all apps', async () => {
      // Create first app
      await app.fetch(
        new Request('http://localhost/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: 'example.com',
            name: 'Example App'
          })
        })
      )

      // Create second app
      await app.fetch(
        new Request('http://localhost/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: 'test.com',
            name: 'Test App'
          })
        })
      )

      const request = new Request('http://localhost/apps')
      const response = await app.fetch(request)

      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data).toEqual({
        apps: [
          {
            id: expect.any(String),
            domain: 'example.com',
            name: 'Example App',
            createdAt: expect.any(Number),
            updatedAt: null
          },
          {
            id: expect.any(String),
            domain: 'test.com',
            name: 'Test App',
            createdAt: expect.any(Number),
            updatedAt: null
          }
        ]
      })
    })
  })

  describe('GET /apps/:id', () => {
    it('should return an app by id', async () => {
      // Create an app
      const createResponse = await app.fetch(
        new Request('http://localhost/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: 'example.com',
            name: 'Example App'
          })
        })
      )

      const createdAppData = (await createResponse.json()) as any
      const createdApp = createdAppData.app

      // Get the app
      const request = new Request(`http://localhost/apps/${createdApp.id}`)
      const response = await app.fetch(request)

      expect(response.status).toBe(200)

      const data = (await response.json()) as any
      expect(data).toEqual({
        app: {
          id: createdApp.id,
          domain: 'example.com',
          name: 'Example App',
          createdAt: expect.any(Number),
          updatedAt: null
        }
      })
    })

    it('should return 404 for non-existent app', async () => {
      const request = new Request('http://localhost/apps/non-existent-id')
      const response = await app.fetch(request)

      expect(response.status).toBe(404)

      const data = (await response.json()) as any
      expect(data).toEqual({
        error: {
          message: 'App not found'
        }
      })
    })
  })
})
