import { Hono } from 'hono'
import invariant from 'tiny-invariant'
import { log } from 'tiny-typescript-logger'
import { HealthCheck } from '../models/health-check'
import { createHealthCheckSchema } from '../schemas/health-check.schema'

export const healthChecksRouter = new Hono()

// Create a health check
healthChecksRouter.post('/', async (c) => {
  const body = await c.req.json()
  const result = createHealthCheckSchema.safeParse(body)

  if (!result.success) {
    return c.json(
      {
        error: {
          message: 'Invalid input',
          details: result.error.issues,
        },
      },
      400
    )
  }

  const healthCheck = await HealthCheck.create(result.data)
  log.info(`Created health check: ${healthCheck.id}`)

  return c.json({ healthCheck }, 201)
})

// List all health checks
healthChecksRouter.get('/', async (c) => {
  const healthChecks = await HealthCheck.all()
  log.info(`Retrieved ${healthChecks.length} health checks`)

  return c.json({ healthChecks })
})

// Get a single health check
healthChecksRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const healthCheck = await HealthCheck.find(id)

  if (!healthCheck) {
    return c.json(
      {
        error: {
          message: 'Health check not found',
        },
      },
      404
    )
  }

  log.info(`Retrieved health check: ${healthCheck.id}`)

  return c.json({ healthCheck })
})
