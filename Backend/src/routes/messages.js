import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { validateRequest } from '../middleware/validateRequest.js'
import { authenticate } from '../middleware/authenticate.js'
import * as ctrl from '../controllers/messagesController.js'
import { sendMessageSchema, markReadSchema } from '../validators/messages.js'

const router = Router()

// Public: recruiters can message a student (rate-limited)
const sendLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 })
router.post('/', sendLimiter, validateRequest(sendMessageSchema), ctrl.sendMessage)

// Student inbox
router.get('/inbox', authenticate, ctrl.inbox)
router.post('/read', authenticate, validateRequest(markReadSchema), ctrl.markRead)

export default router

