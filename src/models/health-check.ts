import { BaseModel } from 'esix'

export class HealthCheck extends BaseModel {
  public appId = ''
  public checkedAt: string | null = null
  public method = ''
  public path = ''
}
