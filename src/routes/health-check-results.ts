import { Hono } from 'hono'
import { log } from 'tiny-typescript-logger'

import { HealthCheckResult } from '../models/health-check-result'
import { serializeHealthCheckResult } from '../serializers'
import { HealthCheck } from '../models/health-check'

export const healthCheckResultsRouter = new Hono()

healthCheckResultsRouter.get('/', async (context) => {
  const checks = await HealthCheck.all()
  const checkIds = checks.map((c) => c.id)

  const healthCheckResults = await HealthCheckResult.whereIn(
    'healthCheckid',
    checkIds
  )
    .orderBy('createdAt', 'desc')
    .get()

  log.info(`Retrieved ${healthCheckResults.length} health check results.`)

  return context.json({
    healthCheckResults: healthCheckResults.map((hc) =>
      serializeHealthCheckResult(hc)
    )
  })
})
