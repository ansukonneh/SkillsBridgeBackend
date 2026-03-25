import { z } from 'zod'

export const requestUniversitySchema = z.object({
  universityName: z.string().min(1, 'University name required'),
  requesterEmail: z.string().email().optional(),
})

export const createUniversitySchema = z.object({
  name: z.string().min(1, 'Name required'),
})
