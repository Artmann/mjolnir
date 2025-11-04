import { describe, expect, it } from 'vitest'
import app from './index'


describe('API', () => {
  it('should return welcome message on root route', async () => {
    const request = new Request('http://localhost/')
    const response = await app.fetch(request)

    expect(response.status).toEqual(200)

    const data = (await response.json()) as any
    
    expect(data).toEqual({
      message: 'Welcome to Mjolnir - Application Health Checks.',
      version: '1.0.0'
    })
  })

  it('should return JSON content type', async () => {
    const request = new Request('http://localhost/')
    const response = await app.fetch(request)

    expect(response.headers.get('content-type')).toEqual('application/json')
  })
})
