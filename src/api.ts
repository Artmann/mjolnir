import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { requestId } from 'hono/request-id'
import { serveStatic } from 'hono/bun'

import { errorHandler } from './middleware/error-handler'
import { appsRouter } from './routes/apps'
import { healthChecksRouter } from './routes/health-checks'
import { healthCheckResultsRouter } from './routes/health-check-results'

const app = new Hono()

const isProduction = process.env.NODE_ENV === 'production'

// Middleware
app.use('*', requestId())
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors())

// Serve static files in production
if (isProduction) {
  app.use('/*', serveStatic({ root: './dist' }))
}

// Routes
app.get('/', (context) => {
  return context.json({
    message: 'Welcome to Mjolnir - Application Health Checks.',
    version: '1.0.0'
  })
})

app.route('/api/apps', appsRouter)
app.route('/api/health-checks', healthChecksRouter)
app.route('/api/health-check-results', healthCheckResultsRouter)

// Error handler
app.onError(errorHandler)

// Serve index.html for all non-API routes in production (SPA fallback)
if (isProduction) {
  app.get('*', serveStatic({ path: './dist/index.html' }))
}

export { app }
