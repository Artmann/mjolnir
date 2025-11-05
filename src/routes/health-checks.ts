import { Hono } from 'hono'
import { log } from 'tiny-typescript-logger'

import { ApiError, ValidationError } from '../errors/api-error'
import { HealthCheck } from '../models/health-check'
import { createHealthCheckSchema } from '../schemas/health-check.schema'
import { serializeHealthCheck } from '../utils/serializers'
import { App } from '../models/app'

export const healthChecksRouter = new Hono()

healthChecksRouter.post('/', async (context) => {
  const body = await context.req.json()

  const result = createHealthCheckSchema.safeParse(body)

  if (!result.success) {
    throw new ValidationError(result.error)
  }

  const app = await App.find(result.data.appId)

  if (!app) {
    throw new ApiError(400, `The app doesn't exist.`)
  }

  const healthCheck = await HealthCheck.create({
    ...result.data,
    appId: app.id,
    checkedAt: null,
  })

  log.info(`Created health check: ${healthCheck.id}`)

  return context.json({ healthCheck: serializeHealthCheck(healthCheck) }, 201)
})

healthChecksRouter.get('/', async (context) => {
  const healthChecks = await HealthCheck.all()

  log.info(`Retrieved ${healthChecks.length} health checks`)

  return context.json({ healthChecks: healthChecks.map(serializeHealthCheck) })
})

healthChecksRouter.get('/:id', async (context) => {
  const id = context.req.param('id')
  const healthCheck = await HealthCheck.find(id)

  if (!healthCheck) {
    throw new ApiError(404, 'Health check not found.')
  }

  log.info(`Retrieved health check: ${healthCheck.id}`)

  return context.json({ healthCheck: serializeHealthCheck(healthCheck) })
})
