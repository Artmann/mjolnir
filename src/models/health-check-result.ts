import { BaseModel } from 'esix'

export class HealthCheckResult extends BaseModel {
  error: string | null = null
  healthCheckId = ''
  statusCode?: number
}
