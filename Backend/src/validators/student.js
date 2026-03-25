import { z } from 'zod'

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  bio: z.string().optional(),
  image: z.string().optional(),
  contactInfo: z.string().optional(),
  isPublic: z.boolean().optional(),
})

export const updateSkillsSchema = z.object({
  skills: z.array(z.string().min(1)).min(0),
})
