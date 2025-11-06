import { log } from 'tiny-typescript-logger'
import { App } from '../models/app'
import { HealthCheck } from '../models/health-check'
import dayjs from 'dayjs'
import { HealthCheckResult } from '../models/health-check-result'

const healthCheckInterval = process.env.HEALTH_CHECK_INTERVAL
  ? Number(process.env.HEALTH_CHECK_INTERVAL)
  : 60 * 1000 // Default: 1 minute

const workerInterval = process.env.WORKER_INTERVAL
  ? Number(process.env.WORKER_INTERVAL)
  : 1000 // Default: 1 second

const requestTimeout = 3000 // 3 seconds

export class HealthCheckWorker {
  private timeoutId: ReturnType<typeof setTimeout> | null = null
  private currentWork: Promise<void> | null = null
  private isShuttingDown = false

  async start() {
    log.info('Starting health check worker...')

    // Run initial check immediately
    await this.runChecks()

    // Then schedule recurring checks
    this.scheduleNextCheck()

    log.info('Health check worker started')
  }

  async stop() {
    log.info('Stopping health check worker...')

    this.isShuttingDown = true

    // Cancel scheduled next check
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)

      this.timeoutId = null
    }

    // Wait for current work to complete
    if (this.currentWork) {
      log.info('Waiting for current health checks to complete...')

      await this.currentWork
    }

    log.info('Health check worker stopped')
  }

  private scheduleNextCheck() {
    if (this.isShuttingDown) {
      return
    }

    this.timeoutId = setTimeout(async () => {
      await this.runChecks()

      this.scheduleNextCheck()
    }, workerInterval)
  }

  private async runChecks() {
    if (this.isShuttingDown) {
      return
    }

    this.currentWork = (async () => {
      try {
        const healthChecks = await HealthCheck.orderBy('checkedAt', 'asc')
          .limit(10)
          .get()

        const checksThatNeedsToRun = healthChecks.filter((hc) => {
          if (hc.checkedAt === null) {
            return true
          }

          const isStale =
            dayjs().diff(dayjs(hc.checkedAt), 'millisecond') >
            healthCheckInterval

          return isStale
        })

        if (checksThatNeedsToRun.length === 0) {
          return
        }

        log.info(`Running ${checksThatNeedsToRun.length} health checks`)

        await Promise.all(
          checksThatNeedsToRun.map((healthCheck) =>
            this.performCheck(healthCheck)
          )
        )
      } catch (error) {
        log.error('Error running health checks:', error)
      }
    })()

    await this.currentWork

    this.currentWork = null
  }

  private async performCheck(
    healthCheck: HealthCheck & { id: string; save: () => Promise<void> }
  ) {
    try {
      const app = await App.find(healthCheck.appId)

      if (!app) {
        log.error(`App not found for health check ${healthCheck.id}`)

        return
      }

      const url = `https://${app.domain}${healthCheck.path}`

      log.info(`Checking: ${healthCheck.method} ${url}`)

      const controller = new AbortController()

      const timeoutId = setTimeout(() => controller.abort(), requestTimeout)

      try {
        const response = await fetch(url, {
          method: healthCheck.method,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        const statusCode = response.status
        const statusText = response.statusText

        log.info(
          `Health check ${healthCheck.id} (${app.name}): ${statusCode} ${statusText}`
        )

        await HealthCheckResult.create({
          error: null,
          healthCheckId: healthCheck.id,
          statusCode
        })

        healthCheck.checkedAt = new Date().toISOString()

        await healthCheck.save()
      } catch (error) {
        clearTimeout(timeoutId)

        const errorMessage = getErrorMessageFromError(error, requestTimeout)
        
        log.info(
          `Health check failed ${healthCheck.id} (${app.name}): ${errorMessage}`
        )

        await HealthCheckResult.create({
          error: errorMessage,
          healthCheckId: healthCheck.id
        })

        healthCheck.checkedAt = new Date().toISOString()

        await healthCheck.save()
      }
    } catch (error) {
      log.error(`Error performing health check ${healthCheck.id}:`, error)
    }
  }
}

function getErrorMessageFromError(
  error: unknown,
  requestTimeout: number
): string {
  if (error instanceof Error) {
    return error.name === 'AbortError'
      ? `The request timed out after ${requestTimeout}ms.`
      : error.message
  }

  return String(error)
}
