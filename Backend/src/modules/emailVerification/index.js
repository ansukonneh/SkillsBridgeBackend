/**
 * Self-contained Email Verification Module
 *
 * Provides token generation, verification email sending, and verification handlers
 * for Express backends with SQLite. Requires:
 * - users table with: emailVerified, verificationToken, verificationTokenExpires
 * - SMTP env: SMTP_HOST, SMTP_USER, SMTP_PASS (optional: SMTP_PORT, SMTP_SECURE, SMTP_FROM)
 * - FRONTEND_URL or app URL for verification links
 */
import crypto from 'crypto'
import * as db from '../../db/index.js'
import { sendVerificationEmail, isEmailConfigured } from '../../utils/email.js'
import { success, error } from '../../utils/response.js'

const VERIFICATION_EXPIRES_HOURS = 24

/**
 * Generate a 32-character random hex token.
 */
export function generateVerificationToken() {
  return crypto.randomBytes(16).toString('hex')
}

/**
 * Get verification token expiry timestamp (24 hours from now).
 */
export function verificationExpiresAt() {
  const d = new Date()
  d.setHours(d.getHours() + VERIFICATION_EXPIRES_HOURS)
  return d.toISOString()
}

/**
 * Send verification email. Uses Nodemailer; credentials from env.
 */
export { sendVerificationEmail, isEmailConfigured }

/**
 * GET /verify-email?token=xxx
 * Verifies the user's email when they click the link.
 */
export async function handleVerifyEmail(req, res, next) {
  try {
    const token = req.query.token
    if (!token) return error(res, 'Verification token is required', 400)

    const user = await db.getUserByVerificationToken(token)
    if (!user) {
      return error(res, 'Invalid or expired verification link. Please request a new one.', 400)
    }

    await db.updateUser(user.id, {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    })

    return success(res, { message: 'Email verified successfully. You can now log in.' })
  } catch (e) {
    next(e)
  }
}

/**
 * Build the verification URL for the given token.
 */
export function buildVerifyUrl(token) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  return `${baseUrl}/verify-email?token=${token}`
}
