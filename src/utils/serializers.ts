import { App } from '../models/app'
import { HealthCheck } from '../models/health-check'

function timestampToISO(timestamp: number | null): string | null {
  if (timestamp === null) {
    return null
  }

  return new Date(timestamp).toISOString()
}

export function serializeApp(app: App) {
  return {
    id: app.id,
    domain: app.domain,
    name: app.name,
    createdAt: timestampToISO(app.createdAt),
    updatedAt: timestampToISO(app.updatedAt)
  }
}

export function serializeHealthCheck(healthCheck: HealthCheck) {
  return {
    id: healthCheck.id,
    appId: healthCheck.appId,
    method: healthCheck.method,
    path: healthCheck.path,
    createdAt: timestampToISO(healthCheck.createdAt),
    updatedAt: timestampToISO(healthCheck.updatedAt)
  }
}
