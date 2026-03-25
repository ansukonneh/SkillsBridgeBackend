import * as db from '../db/index.js'
import { success, error } from '../utils/response.js'

export async function sendMessage(req, res, next) {
  try {
    const { toUserId, fromName, fromEmail, subject, body } = req.body

    const recipient = await db.getUserById(toUserId)
    if (!recipient) return error(res, 'Recipient not found', 404)
    if (recipient.role !== 'student') return error(res, 'Recipient is not a student', 400)
    if (recipient.isSuspended) return error(res, 'Recipient is unavailable', 403)

    const msg = await db.createMessage({ toUserId, fromName, fromEmail, subject, body })
    return success(res, { message: msg }, 201)
  } catch (e) {
    next(e)
  }
}

export async function inbox(req, res, next) {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30))
    const page = Math.max(1, Number(req.query.page) || 1)
    const offset = (page - 1) * limit
    const items = await db.getInboxMessages(req.user.id, { limit, offset })
    return success(res, { messages: items, pagination: { page, limit } })
  } catch (e) {
    next(e)
  }
}

export async function markRead(req, res, next) {
  try {
    const { messageId } = req.body
    const msg = await db.markMessageRead(req.user.id, messageId)
    if (!msg) return error(res, 'Message not found', 404)
    return success(res, { message: msg })
  } catch (e) {
    next(e)
  }
}

