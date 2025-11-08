import dayjs from 'dayjs'
import { App } from './models/app'
import { HealthCheck } from './models/health-check'
import { HealthCheckResult } from './models/health-check-result'

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

export function serializeHealthCheckResult(
  healthCheckResult: HealthCheckResult
) {
  return {
    createdAt: dayjs(healthCheckResult.createdAt).toISOString(),
    error: healthCheckResult.error ?? null,
    healthCheckId: healthCheckResult.healthCheckId,
    id: healthCheckResult.id,
    statusCode: healthCheckResult.statusCode ?? null
  }
}

export type SerializedHealthCheck = typeof serializeHealthCheckResult
