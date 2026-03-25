import { z } from 'zod'

export const sendMessageSchema = z.object({
  toUserId: z.string().min(1, 'Recipient required'),
  fromName: z.string().min(2, 'Name required'),
  fromEmail: z.string().email('Valid email required'),
  subject: z.string().max(120).optional(),
  body: z.string().min(10, 'Message must be at least 10 characters').max(2000),
})

export const markReadSchema = z.object({
  messageId: z.string().min(1, 'Message id required'),
})

