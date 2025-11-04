import { BaseModel } from 'esix'

export class HealthCheck extends BaseModel {
  public appId = ''
  public environmentId = ''
  public method = ''
  public path = ''
}
