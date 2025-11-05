import { log } from 'tiny-typescript-logger'
import { App } from '../models/app'
import { HealthCheck } from '../models/health-check'
import dayjs from 'dayjs'

const checkInterval = 60 * 1000 // Check every minute
const staleThreshold = 5 * 60 * 1000 // 5 minutes
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
    }, checkInterval)
  }

  private async runChecks() {
    if (this.isShuttingDown) {
      return
    }

    this.currentWork = (async () => {
      try {
        console.log('Running health checks...')
        const healthChecks = await HealthCheck.orderBy('checkedAt', 'asc').limit(10).get()
        
        const checksThatNeedsToRun = healthChecks.filter((hc) => {
          if (hc.checkedAt === null) {
            return true
          }

          const isOlderThan5Minutes = dayjs().diff(dayjs(hc.checkedAt), 'millisecond') > 5 * 60_000

          return isOlderThan5Minutes
        })

        if (checksThatNeedsToRun.length === 0) {
          return
        }

        log.info(`Running ${checksThatNeedsToRun.length} health checks`)

        await Promise.all(
          checksThatNeedsToRun.map((healthCheck) => this.performCheck(healthCheck))
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

        const status = response.status
        const statusText = response.statusText

        log.info(
          `Health check ${healthCheck.id} (${app.name}): ${status} ${statusText}`
        )

        healthCheck.checkedAt = new Date().toISOString()

        await healthCheck.save()
      } catch (error) {
        clearTimeout(timeoutId)

        if (error instanceof Error && error.name === 'AbortError') {
          log.error(
            `Health check ${healthCheck.id} (${app.name}): Timeout after ${requestTimeout}ms`
          )
        } else {
          log.error(
            `Health check ${healthCheck.id} (${app.name}): ${error instanceof Error ? error.message : String(error)}`
          )
        }

        healthCheck.checkedAt = new Date().toISOString()

        await healthCheck.save()
      }
    } catch (error) {
      log.error(`Error performing health check ${healthCheck.id}:`, error)
    }
  }
}
