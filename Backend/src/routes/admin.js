import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { patchUniversityRequestSchema, suspendUserSchema } from '../validators/admin.js'
import { createUniversitySchema } from '../validators/university.js'
import * as ctrl from '../controllers/adminController.js'

const router = Router()

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
