import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { requestId } from 'hono/request-id'

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

export { app }

export default {
  port: 3000,
  fetch: app.fetch,
}
