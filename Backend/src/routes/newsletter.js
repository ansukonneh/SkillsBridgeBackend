import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { validateRequest } from '../middleware/validateRequest.js'
import { newsletterSubscribeSchema } from '../validators/newsletter.js'
import * as ctrl from '../controllers/newsletterController.js'

const router = Router()

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 })
router.post('/subscribe', limiter, validateRequest(newsletterSubscribeSchema), ctrl.subscribe)

export default router

