import { log } from 'tiny-typescript-logger'
import { App } from '../models/app'
import { HealthCheck } from '../models/health-check'

const CHECK_INTERVAL = 60 * 1000 // Check every minute
const STALE_THRESHOLD = 5 * 60 * 1000 // 5 minutes
const REQUEST_TIMEOUT = 3000 // 3 seconds

export class HealthCheckWorker {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private currentWork: Promise<void> | null = null
  private isShuttingDown = false

  start() {
    log.info('Starting health check worker...')

    // Run immediately on start
    this.runChecks()

    // Then run every minute
    this.intervalId = setInterval(() => {
      this.runChecks()
    }, CHECK_INTERVAL)

    log.info('Health check worker started')
  }

  async stop() {
    log.info('Stopping health check worker...')
    this.isShuttingDown = true

    // Stop the interval
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    // Wait for current work to complete
    if (this.currentWork) {
      log.info('Waiting for current health checks to complete...')
      await this.currentWork
    }

    log.info('Health check worker stopped')
  }

  private async runChecks() {
    // Skip if shutting down
    if (this.isShuttingDown) {
      return
    }

    // Create a promise for the current work
    this.currentWork = (async () => {
      try {
        const healthChecks = await HealthCheck.all()
        const now = Date.now()

        // Filter checks that need to be run (never checked or last checked > 5 minutes ago)
        const checksToRun = healthChecks.filter((check) => {
          return !check.checkedAt || now - check.checkedAt > STALE_THRESHOLD
        })

        if (checksToRun.length === 0) {
          log.debug('No health checks to run')
          return
        }

        log.info(`Running ${checksToRun.length} health checks`)

        // Run all checks in parallel
        await Promise.all(
          checksToRun.map((healthCheck) => this.performCheck(healthCheck))
        )
      } catch (error) {
        log.error('Error running health checks:', error)
      }
    })()

    await this.currentWork
    this.currentWork = null
  }

  private async performCheck(healthCheck: HealthCheck & { id: string; save: () => Promise<void> }) {
    try {
      // Get the associated app
      const app = await App.find(healthCheck.appId)

      if (!app) {
        log.error(`App not found for health check ${healthCheck.id}`)
        return
      }

      // Construct the URL
      const url = `${app.domain}${healthCheck.path}`

      log.info(`Checking: ${healthCheck.method} ${url}`)

      // Make the HTTP request with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

      try {
        const response = await fetch(url, {
          method: healthCheck.method,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        const status = response.status
        const statusText = response.statusText

        log.info(
          `Health check ${healthCheck.id} (${app.name}): ${status} ${statusText}`
        )

        // Update checkedAt timestamp
        healthCheck.checkedAt = Date.now()
        await healthCheck.save()
      } catch (error) {
        clearTimeout(timeoutId)

        if (error instanceof Error && error.name === 'AbortError') {
          log.error(
            `Health check ${healthCheck.id} (${app.name}): Timeout after ${REQUEST_TIMEOUT}ms`
          )
        } else {
          log.error(
            `Health check ${healthCheck.id} (${app.name}): ${error instanceof Error ? error.message : String(error)}`
          )
        }

        // Still update checkedAt even if the check failed
        healthCheck.checkedAt = Date.now()
        await healthCheck.save()
      }
    } catch (error) {
      log.error(`Error performing health check ${healthCheck.id}:`, error)
    }
  }
}
