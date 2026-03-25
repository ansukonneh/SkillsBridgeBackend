import { z } from 'zod'

const linkSchema = z.object({ label: z.string(), url: z.string() })

export const createProjectSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  technologies: z.array(z.string()).default([]),
  links: z.array(linkSchema).default([]),
})

export const updateProjectSchema = createProjectSchema.partial()
