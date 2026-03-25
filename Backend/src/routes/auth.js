import { Router } from 'express'
import { validateRequest } from '../middleware/validateRequest.js'
import { authenticate } from '../middleware/authenticate.js'
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.js'
import * as ctrl from '../controllers/authController.js'
import { handleVerifyEmail } from '../modules/emailVerification/index.js'

const router = Router()

router.post('/register', validateRequest(registerSchema), ctrl.register)
router.post('/login', validateRequest(loginSchema), ctrl.login)
router.get('/verify-email', handleVerifyEmail)
router.post('/verify-email', validateRequest(verifyEmailSchema), ctrl.verifyEmail)
router.post('/resend-verification', validateRequest(resendVerificationSchema), ctrl.resendVerification)
router.post('/forgot-password', validateRequest(forgotPasswordSchema), ctrl.forgotPassword)
router.post('/reset-password', validateRequest(resetPasswordSchema), ctrl.resetPassword)
router.get('/me', authenticate, ctrl.me)

export default router
