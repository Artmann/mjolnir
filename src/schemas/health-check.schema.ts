import { z } from 'zod'

export const createHealthCheckSchema = z.object({
  appId: z.string().min(1),
  method: z.string().min(1).optional().default('GET'),
  path: z.string().min(1)
})

export type CreateHealthCheckInput = z.infer<typeof createHealthCheckSchema>
