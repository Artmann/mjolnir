import { app } from './api'
import { HealthCheckWorker } from './workers/health-check-worker'

const port = process.env.PORT ? Number(process.env.PORT) : 8888

const worker = new HealthCheckWorker()

await worker.start()

// Graceful shutdown on SIGINT and SIGTERM
const shutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}, shutting down gracefully...`)
 
  await worker.stop()
 
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

export default {
  fetch: app.fetch,
  port
}
