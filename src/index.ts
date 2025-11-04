import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { requestId } from 'hono/request-id'

import { appsRouter } from './routes/apps'
import { healthChecksRouter } from './routes/health-checks'

const app = new Hono()

// Middleware
app.use('*', requestId())
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors())

// Routes
app.get('/', (context) => {
  return context.json({
    message: 'Welcome to Mjolnir - Application Health Checks.',
    version: '1.0.0'
  })
})

app.route('/apps', appsRouter)
app.route('/health-checks', healthChecksRouter)

// Export the app 
const port = process.env.PORT ? Number(process.env.PORT) : 8080

export { app }

export default {
  port,
  fetch: app.fetch
}
