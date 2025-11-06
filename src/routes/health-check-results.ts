import { Hono } from 'hono'
import { log } from 'tiny-typescript-logger'

import { HealthCheckResult } from '../models/health-check-result'
import { serializeHealthCheckResult } from '../serializers'

export const healthCheckResultsRouter = new Hono()

healthCheckResultsRouter.get('/', async (context) => {
  const healthCheckResults = await HealthCheckResult.all()

  log.info(`Retrieved ${healthCheckResults.length} health check results.`)

  return context.json({
    healthCheckResults: healthCheckResults.map(hc => serializeHealthCheckResult(hc))
  })
})