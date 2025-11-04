import { Hono } from 'hono'
import invariant from 'tiny-invariant'
import { log } from 'tiny-typescript-logger'
import { ApiError, ValidationError } from '../errors/api-error'
import { App } from '../models/app'
import { createAppSchema } from '../schemas/app.schema'
import { serializeApp } from '../utils/serializers'

export const appsRouter = new Hono()

// Create an app
appsRouter.post('/', async (c) => {
  const body = await c.req.json()
  const result = createAppSchema.safeParse(body)

  if (!result.success) {
    throw new ValidationError(result.error)
  }

  const app = await App.create(result.data)
  log.info(`Created app: ${app.id}`)

  return c.json({ app: serializeApp(app) }, 201)
})

// List all apps
appsRouter.get('/', async (c) => {
  const apps = await App.all()
  log.info(`Retrieved ${apps.length} apps`)

  return c.json({ apps: apps.map(serializeApp) })
})

// Get a single app
appsRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const app = await App.find(id)

  if (!app) {
    throw new ApiError(404, 'App not found')
  }

  log.info(`Retrieved app: ${app.id}`)

  return c.json({ app: serializeApp(app) })
})
