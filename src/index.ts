import { createServer } from 'vite'
import { app } from './api'
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

  // Proxy non-API requests to Vite dev server
  app.use('*', async (c, next) => {
    // Skip proxy for API routes
    if (c.req.path.startsWith('/api')) {
      return next()
    }

    // Proxy to Vite dev server
    const viteUrl = `http://localhost:${vitePort}${c.req.path}`
    const response = await fetch(viteUrl, {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? c.req.raw.body : undefined
    })

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    })
  })
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
