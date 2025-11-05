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
    createdAt: timestampToISO(app.createdAt),
    domain: app.domain,
    id: app.id,
    name: app.name,
    updatedAt: timestampToISO(app.updatedAt)
  }
}

export function serializeHealthCheck(healthCheck: HealthCheck) {
  return {
    appId: healthCheck.appId,
    checkedAt: healthCheck.checkedAt || null,
    createdAt: timestampToISO(healthCheck.createdAt),
    id: healthCheck.id,
    method: healthCheck.method,
    path: healthCheck.path,
    updatedAt: timestampToISO(healthCheck.updatedAt)
  }
}
