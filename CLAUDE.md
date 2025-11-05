# Mjolnir - Application Health Checks

A robust API for managing application health checks and monitoring.

## Project Overview

Mjolnir is a health check monitoring service built with:

- **Hono** - Fast web framework
- **Bun** - JavaScript runtime and package manager
- **Esix** - Database ORM with support for SQLite and mock adapters
- **Zod** - Schema validation
- **Vitest** - Testing framework

## Architecture

### Directory Structure

```
src/
├── errors/           # Custom error classes
│   └── api-error.ts  # ApiError and ValidationError classes
├── middleware/       # Express/Hono middleware
│   └── error-handler.ts  # Global error handler
├── models/          # Database models
│   ├── app.ts       # Application model
│   └── health-check.ts  # Health check model
├── routes/          # API route handlers
│   ├── apps.ts      # App management endpoints
│   └── health-checks.ts  # Health check endpoints
├── schemas/         # Zod validation schemas
│   ├── app.schema.ts
│   └── health-check.schema.ts
├── utils/           # Utility functions
│   └── serializers.ts  # Response serialization
└── index.ts         # Application entry point
```

### Core Concepts

#### Error Handling

The application uses a centralized error handling system:

- **ApiError**: Base error class for API errors with status codes
- **ValidationError**: Specialized error for Zod validation failures
- Validation errors are transformed from Zod's verbose format to a simplified
  format:
  ```json
  {
    "error": {
      "message": "Validation error",
      "details": {
        "fieldName": "Error message."
      }
    }
  }
  ```

#### Timestamp Serialization

Esix stores timestamps as Unix milliseconds (numbers) in the database. The API
automatically converts these to ISO 8601 strings with timezone:

- **Database**: `1704450645123` (Unix timestamp)
- **API Response**: `"2024-01-15T10:30:45.123Z"` (ISO 8601 string)

Serializers in `src/utils/serializers.ts` handle this transformation for all
responses.

#### Models

Models extend `BaseModel` from Esix and automatically include:

- `id` - Unique identifier
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## API Endpoints

### Apps

- `POST /apps` - Create a new application
- `GET /apps` - List all applications
- `GET /apps/:id` - Get a specific application

### Health Checks

- `POST /health-checks` - Create a new health check
- `GET /health-checks` - List all health checks
- `GET /health-checks/:id` - Get a specific health check

## Development

### Running the Application

```bash
# Development mode with auto-reload
bun run dev

# Production mode
bun run start
```

### Testing

```bash
# Run all tests
bun run test

# Run tests once (CI mode)
bun run test run

# Run tests with coverage
bun run test:coverage
```

### Test Patterns

Tests follow these conventions:

- Use `beforeEach` for test isolation with unique database names
- Mock `Date.now()` for timestamp testing with fixed values
- Use `.toEqual()` for all assertions (not `.toBe()`)
- Add blank line between assertion groups for readability
- Test exact error messages and structures (no regex)

Example test structure:

```typescript
it('should create an app', async () => {
  const request = new Request('http://localhost/apps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain: 'example.com', name: 'Example' })
  })

  const response = await app.fetch(request)

  expect(response.status).toEqual(201)

  const data = (await response.json()) as any

  expect(data.app.domain).toEqual('example.com')
})
```

## Database Configuration

The application uses Esix ORM with configurable adapters:

- **Development/Production**: SQLite (via `DB_ADAPTER=sqlite`)
- **Testing**: Mock adapter (via `DB_ADAPTER=mock`)

Configuration is done via environment variables:

```bash
DB_ADAPTER=sqlite
DB_DATABASE=./data/mjolnir.db
```

## Code Style

- Use named imports: `import { app } from './index'`
- Add blank lines between imports and code
- Format with consistent spacing (handled by linter)
- Use explicit types for complex objects
- Keep functions small and focused

## Adding New Features

1. **Create the model** in `src/models/`
2. **Create the schema** in `src/schemas/`
3. **Create the routes** in `src/routes/`
4. **Add serializer** in `src/utils/serializers.ts`
5. **Register routes** in `src/index.ts`
6. **Write tests** in `src/routes/*.test.ts`

### Example: Adding a New Resource

```typescript
// 1. Model (src/models/monitor.ts)
import { BaseModel } from 'esix'

export class Monitor extends BaseModel {
  public name = ''
  public url = ''
}

// 2. Schema (src/schemas/monitor.schema.ts)
import { z } from 'zod'

export const createMonitorSchema = z.object({
  name: z.string().min(1),
  url: z.string().url()
})

// 3. Serializer (src/utils/serializers.ts)
export function serializeMonitor(monitor: Monitor) {
  return {
    id: monitor.id,
    name: monitor.name,
    url: monitor.url,
    createdAt: timestampToISO(monitor.createdAt),
    updatedAt: timestampToISO(monitor.updatedAt)
  }
}

// 4. Routes (src/routes/monitors.ts)
import { Hono } from 'hono'
import { ValidationError } from '../errors/api-error'
import { Monitor } from '../models/monitor'
import { createMonitorSchema } from '../schemas/monitor.schema'
import { serializeMonitor } from '../utils/serializers'

export const monitorsRouter = new Hono()

monitorsRouter.post('/', async (c) => {
  const body = await c.req.json()
  const result = createMonitorSchema.safeParse(body)

  if (!result.success) {
    throw new ValidationError(result.error)
  }

  const monitor = await Monitor.create(result.data)
  return c.json({ monitor: serializeMonitor(monitor) }, 201)
})
```

## Deployment

The application is deployed to Railway with automatic deployments from the main
branch.

Environment variables required:

- `PORT` - Server port (default: 8080)
- `DB_ADAPTER` - Database adapter ('sqlite' or 'mock')
- `DB_DATABASE` - Database file path or name

## Contributing

1. Follow the existing code patterns
2. Write tests for all new features
3. Ensure all tests pass before committing
4. Use descriptive commit messages
5. Update this documentation for significant changes
