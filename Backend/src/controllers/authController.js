import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import * as db from '../db/index.js'
import { success, error } from '../utils/response.js'
import { sendPasswordResetEmail } from '../utils/email.js'
import {
  sendVerificationEmail,
  isEmailConfigured,
  generateVerificationToken,
  verificationExpiresAt,
  buildVerifyUrl,
} from '../modules/emailVerification/index.js'
import crypto from 'crypto'

function signToken(userId, role) {
  return jwt.sign(
    { userId, role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  )
}

function toUserResponse(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    universityId: user.universityId,
  }
}

export async function register(req, res, next) {
  try {
    const { fullName, email, password, universityId } = req.body
    const existing = await db.getUserByEmail(email)
    if (existing) return error(res, 'Email already registered', 409)

    if (universityId) {
      const university = await db.getUniversityById(universityId)
      if (!university || !university.approved) return error(res, 'Invalid or unapproved university', 400)
    }

    const hash = await bcrypt.hash(password, config.bcryptRounds)
    const verificationToken = generateVerificationToken()
    const verificationTokenExpires = verificationExpiresAt()

    const user = await db.createUser({
      fullName,
      email,
      password: hash,
      universityId: universityId || null,
      role: 'student',
      emailVerified: false,
      verificationToken,
      verificationTokenExpires,
    })

    const verifyUrl = buildVerifyUrl(verificationToken)

    if (isEmailConfigured()) {
      sendVerificationEmail(email, fullName, verifyUrl)
        .then((info) => console.log('Verification email sent:', info?.messageId || '(no messageId)'))
        .catch((err) => console.error('Failed to send verification email:', err.message))
    }

    return success(res, {
      user: toUserResponse(user),
      verificationToken: isEmailConfigured() ? undefined : verificationToken,
      verifyUrl,
      message: isEmailConfigured()
        ? 'Verification email sent. Check your inbox.'
        : 'Please verify your email. Use the link below or check your inbox once email is configured.',
    }, 201)
  } catch (e) {
    next(e)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    const user = await db.getUserByEmailWithUniversity(email)
    if (!user) return error(res, 'Invalid email or password', 401)
    if (user.isSuspended) return error(res, 'Account suspended', 403)
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return error(res, 'Invalid email or password', 401)

    // Require email verification for students (admins bypass)
    if (user.role === 'student' && !user.emailVerified) {
      return error(res, 'Please verify your email before logging in. Check your inbox for the verification link.', 403)
    }

    const token = signToken(user.id, user.role)
    return success(res, { user: toUserResponse(user), token, role: user.role })
  } catch (e) {
    next(e)
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.body
    if (!token) return error(res, 'Verification token is required', 400)

    const user = await db.getUserByVerificationToken(token)
    if (!user) return error(res, 'Invalid or expired verification link. Please request a new one.', 400)

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

export async function resendVerification(req, res, next) {
  try {
    const { email } = req.body
    if (!email) return error(res, 'Email is required', 400)

    const user = await db.getUserByEmail(email)
    if (!user) return error(res, 'No account found with that email', 404)
    if (user.emailVerified) return error(res, 'Email is already verified. You can log in.', 400)

    const verificationToken = generateVerificationToken()
    const verificationTokenExpires = verificationExpiresAt()
    await db.updateUser(user.id, { verificationToken, verificationTokenExpires })

    const verifyUrl = buildVerifyUrl(verificationToken)

    if (isEmailConfigured()) {
      sendVerificationEmail(email, user.fullName, verifyUrl)
        .then((info) => console.log('Verification email resent:', info?.messageId || '(no messageId)'))
        .catch((err) => console.error('Failed to resend verification email:', err.message))
    }

    return success(res, {
      verificationToken: isEmailConfigured() ? undefined : verificationToken,
      verifyUrl,
      message: isEmailConfigured() ? 'Verification email sent.' : 'Verification link generated. Use the link below.',
    })
  } catch (e) {
    next(e)
  }
}

function passwordResetExpiresAt() {
  const d = new Date()
  d.setHours(d.getHours() + 1)
  return d.toISOString()
}

function buildResetUrl(token) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  return `${baseUrl}/reset-password?token=${token}`
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body
    const user = await db.getUserByEmail(email)

    // Always return success (avoid account enumeration)
    if (!user) {
      return success(res, { message: 'If an account exists for that email, a reset link has been sent.' })
    }

    const token = crypto.randomBytes(16).toString('hex')
    const expires = passwordResetExpiresAt()
    await db.updateUser(user.id, { passwordResetToken: token, passwordResetTokenExpires: expires })

    const resetUrl = buildResetUrl(token)

    if (isEmailConfigured()) {
      sendPasswordResetEmail(user.email, user.fullName, resetUrl)
        .then((info) => console.log('Password reset email sent:', info?.messageId || '(no messageId)'))
        .catch((err) => console.error('Failed to send password reset email:', err.message))
    }

    return success(res, {
      resetToken: isEmailConfigured() ? undefined : token,
      resetUrl,
      message: isEmailConfigured()
        ? 'If an account exists for that email, a reset link has been sent.'
        : 'Reset link generated. Use the link below (configure email to send it automatically).',
    })
  } catch (e) {
    next(e)
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body
    const user = await db.getUserByPasswordResetToken(token)
    if (!user) return error(res, 'Invalid or expired reset link. Please request a new one.', 400)

    const hash = await bcrypt.hash(password, config.bcryptRounds)
    await db.updateUser(user.id, {
      password: hash,
      passwordResetToken: null,
      passwordResetTokenExpires: null,
    })

    return success(res, { message: 'Password updated. You can now log in.' })
  } catch (e) {
    next(e)
  }
}

export async function me(req, res) {
  return success(res, { user: toUserResponse(req.user) })
}
