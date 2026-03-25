import { z } from 'zod'

export const newsletterSubscribeSchema = z.object({
  email: z.string().email('Invalid email'),
})

