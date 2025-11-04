import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { requestId } from 'hono/request-id'
import { appsRouter } from './routes/apps'
import { healthChecksRouter } from './routes/health-checks'
import { HealthCheckWorker } from './workers/health-check-worker'

const app = new Hono()

// Middleware
app.use('*', requestId())
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors())

// Routes
app.get('/', (c) => {
  return c.json({
    message: 'Welcome to Mjolnir - Application Health Checks API',
    version: '1.0.0',
  })
})

app.route('/apps', appsRouter)
app.route('/health-checks', healthChecksRouter)

// Start background worker
const worker = new HealthCheckWorker()
worker.start()

// Graceful shutdown on SIGINT and SIGTERM
const shutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}, shutting down gracefully...`)
  await worker.stop()
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

export { app }

export default {
  port: 3000,
  fetch: app.fetch,
}
