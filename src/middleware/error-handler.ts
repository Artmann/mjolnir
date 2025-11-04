import { Context } from 'hono'
import { log } from 'tiny-typescript-logger'
import { ApiError } from '../errors/api-error'

export function errorHandler(err: Error, c: Context) {
  log.error(`Error: ${err.message}`, err)

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.message.includes('JSON')) {
    return c.json(
      {
        error: {
          message: 'Invalid JSON in request body'
        }
      },
      400
    )
  }

  if (err instanceof ApiError) {
    const response: any = {
      error: {
        message: err.message
      }
    }

    if (err.details) {
      response.error.details = err.details
    }

    return c.json(response, err.statusCode)
  }

  return c.json(
    {
      error: {
        message: 'Something went wrong. Please try again.'
      }
    },
    500
  )
}
