import { BaseModel } from 'esix'

export class HealthCheck extends BaseModel {
  public path = ''
  public method = ''
  public appId = ''
  public environmentId = ''
}
