import { Hono } from 'hono'
import invariant from 'tiny-invariant'
import { log } from 'tiny-typescript-logger'
import { App } from '../models'
import { createAppSchema } from '../schemas/app.schema'

export const appsRouter = new Hono()

// Create an app
appsRouter.post('/', async (c) => {
  const body = await c.req.json()
  const result = createAppSchema.safeParse(body)

  if (!result.success) {
    return c.json({ error: 'Invalid input', details: result.error.issues }, 400)
  }

  const app = await App.create(result.data)
  log.info(`Created app: ${app.id}`)

  return c.json(app, 201)
})

// List all apps
appsRouter.get('/', async (c) => {
  const apps = await App.all()
  log.info(`Retrieved ${apps.length} apps`)

  return c.json(apps)
})

// Get a single app
appsRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const app = await App.find(id)

  if (!app) {
    return c.json({ error: 'App not found' }, 404)
  }

  log.info(`Retrieved app: ${app.id}`)

  return c.json(app)
})
