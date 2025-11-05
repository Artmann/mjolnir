import { z } from 'zod'

export const createAppSchema = z.object({
  domain: z.string().min(1),
  name: z.string().min(1)
})

export type CreateAppInput = z.infer<typeof createAppSchema>
