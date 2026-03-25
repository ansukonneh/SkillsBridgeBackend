import { z } from 'zod'

export const patchUniversityRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
})

export const suspendUserSchema = z.object({
  reason: z.string().optional(),
})
