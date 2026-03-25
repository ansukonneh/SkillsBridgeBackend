/**
 * Email sending via nodemailer.
 * Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env to enable.
 * Without these, verification links are only returned in the API response.
 */
import nodemailer from 'nodemailer'

let transporter = null
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

export function isEmailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

export async function verifyEmailTransport() {
  if (!isEmailConfigured() || !transporter) return { ok: false, reason: 'not_configured' }
  await transporter.verify()
  return { ok: true }
}

export async function sendVerificationEmail(to, fullName, verifyUrl) {
  if (!isEmailConfigured() || !transporter) return { sent: false }

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Verify your SkillsBridge email',
    html: `
      <p>Hi ${fullName},</p>
      <p>Thanks for signing up for SkillsBridge.</p>
      <p>Please click the link below to verify your email address:</p>
      <p><a href="${verifyUrl}" style="color:#6d28d9">Verify my email</a></p>
      <p>Or copy and paste this URL into your browser: ${verifyUrl}</p>
      <p>This link expires in 24 hours.</p>
      <p>If you did not create an account, you can safely ignore this email.</p>
      <p>— SkillsBridge</p>
    `,
    text: `Hi ${fullName}, please verify your email by clicking: ${verifyUrl} (expires in 24h). If you did not sign up, you can ignore this email.`,
  })
  return { sent: true, messageId: info?.messageId }
}

export async function sendPasswordResetEmail(to, fullName, resetUrl) {
  if (!isEmailConfigured() || !transporter) return { sent: false }

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Reset your SkillsBridge password',
    html: `
      <p>Hi ${fullName || 'there'},</p>
      <p>We received a request to reset your SkillsBridge password.</p>
      <p><a href="${resetUrl}" style="color:#6d28d9">Reset my password</a></p>
      <p>Or copy and paste this URL into your browser: ${resetUrl}</p>
      <p>This link expires in 1 hour.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p>— SkillsBridge</p>
    `,
    text: `Hi ${fullName || 'there'}, reset your SkillsBridge password: ${resetUrl} (expires in 1h). If you did not request this, ignore this email.`,
  })
  return { sent: true, messageId: info?.messageId }
}

export async function sendNewsletterEmail(to) {
  if (!isEmailConfigured() || !transporter) return { sent: false }

  const frontendUrl = process.env.FRONTEND_URL || process.env.FRONTEND_PUBLIC_URL || 'http://localhost:5173'

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Welcome to SkillsBridge newsletter',
    html: `
      <p>Hi there,</p>
      <p>Thanks for subscribing to SkillsBridge.</p>
      <p>We’ll send you updates on new features and opportunities.</p>
      <p style="margin-top:16px;">
        <a href="${frontendUrl}" style="color:#6d28d9;">Visit SkillsBridge</a>
      </p>
      <p>— SkillsBridge</p>
    `,
    text: `Thanks for subscribing to SkillsBridge. We'll send you updates on new features and opportunities.`,
  })

  return { sent: true, messageId: info?.messageId }
}
