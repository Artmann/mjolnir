import { BaseModel } from 'esix'

export class HealthCheck extends BaseModel {
  public appId = ''
  public method = ''
  public path = ''
  public checkedAt: number | null = null
}
