import { z } from 'zod'

export const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  universityId: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token required'),
})

export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
