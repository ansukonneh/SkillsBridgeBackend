import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { patchUniversityRequestSchema, suspendUserSchema } from '../validators/admin.js'
import { createUniversitySchema } from '../validators/university.js'
import * as ctrl from '../controllers/adminController.js'
import { loginSchema } from '../validators/auth.js'
import { adminLogin } from '../controllers/authController.js'

const router = Router()

// Admin-only login (no auth required). Mounted at /api/admin, so this is POST /api/admin
router.post('/', validateRequest(loginSchema), adminLogin)

router.use(authenticate)
router.use(authorizeRole('admin'))

router.get('/university-requests', ctrl.getUniversityRequests)
router.patch('/university-requests/:id', validateRequest(patchUniversityRequestSchema), ctrl.patchUniversityRequest)
router.post('/universities', validateRequest(createUniversitySchema), ctrl.createUniversity)
router.patch('/users/:id/suspend', validateRequest(suspendUserSchema), ctrl.suspendUser)
router.post('/users/:id/suspend', validateRequest(suspendUserSchema), ctrl.suspendUser)
router.post('/users/:id/unsuspend', ctrl.unsuspendUser)
router.get('/students', ctrl.getStudents)
router.get('/analytics', ctrl.getAnalytics)

export default router
