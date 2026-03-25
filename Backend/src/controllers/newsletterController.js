import * as db from '../db/index.js'
import { success } from '../utils/response.js'
import { sendNewsletterEmail } from '../utils/email.js'

export async function subscribe(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()

    // Used only for the API response (frontend/debug); email sending is rate-limited already.
    const existing = await db.getNewsletterSubscriberByEmail(email)
    await db.createNewsletterSubscriber(email)

    let emailSent = false
    try {
      const result = await sendNewsletterEmail(email)
      emailSent = !!result?.sent
    } catch {
      // Don't fail subscription request if email sending fails.
    }

    return success(res, { message: 'Subscribed successfully', emailSent, alreadySubscribed: !!existing }, 201)
  } catch (e) {
    next(e)
  }
}

