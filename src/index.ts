import { createServer } from 'vite'
import { app, setupViteProxy } from './api'
import { HealthCheckWorker } from './workers/health-check-worker'

const port = process.env.PORT ? Number(process.env.PORT) : 8888
const vitePort = 5173
const isDevelopment = process.env.NODE_ENV !== 'production'

let viteServer: Awaited<ReturnType<typeof createServer>> | null = null

// Start Vite dev server in development mode
if (isDevelopment) {
  viteServer = await createServer({
    configFile: './vite.config.ts',
    server: {
      port: vitePort,
      strictPort: true
    }
  })

  await viteServer.listen()
  console.log(`Vite dev server running at http://localhost:${vitePort}`)

  // Setup proxy to Vite dev server (registered after all API routes)
  setupViteProxy(vitePort)
}

const worker = new HealthCheckWorker()

await worker.start()

// Graceful shutdown on SIGINT and SIGTERM
const shutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}, shutting down gracefully...`)

  await worker.stop()

  if (viteServer) {
    await viteServer.close()
  }

  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

export default {
  fetch: app.fetch,
  port
}
