import { Hono } from 'hono'
import { log } from 'tiny-typescript-logger'

import { ApiError, ValidationError } from '../errors/api-error'
import { App } from '../models/app'
import { createAppSchema } from '../schemas/app.schema'
import { serializeApp } from '../utils/serializers'

export const appsRouter = new Hono()

appsRouter.post('/', async (context) => {
  const body = await context.req.json()

  const result = createAppSchema.safeParse(body)

  if (!result.success) {
    throw new ValidationError(result.error)
  }

  const app = await App.create(result.data)

  log.info(`Created app: ${app.id}`)

  return context.json({ app: serializeApp(app) }, 201)
})

appsRouter.get('/', async (context) => {
  const apps = await App.all()
  log.info(`Retrieved ${apps.length} apps`)

  return context.json({ apps: apps.map(serializeApp) })
})

appsRouter.get('/:id', async (context) => {
  const id = context.req.param('id')
  const app = await App.find(id)

  if (!app) {
    throw new ApiError(404, 'App not found.')
  }

  log.info(`Retrieved app: ${app.id}`)

  return context.json({ app: serializeApp(app) })
})
