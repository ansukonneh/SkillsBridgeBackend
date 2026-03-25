import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { optionalAuth } from '../middleware/optionalAuth.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { requestUniversitySchema, createUniversitySchema } from '../validators/university.js'
import * as ctrl from '../controllers/universitiesController.js'
import * as adminCtrl from '../controllers/adminController.js'

const router = Router()

router.get('/', ctrl.list)

// University request is public — optionalAuth attaches user if logged in
router.post('/request', optionalAuth, validateRequest(requestUniversitySchema), ctrl.requestUniversity)

// Admin-only routes
router.get('/requests', authenticate, authorizeRole('admin'), adminCtrl.getUniversityRequests)
router.post('/requests/:id/approve', authenticate, authorizeRole('admin'), (req, res, next) => { req.body = { status: 'approved' }; return adminCtrl.patchUniversityRequest(req, res, next) })
router.post('/requests/:id/reject', authenticate, authorizeRole('admin'), (req, res, next) => { req.body = { status: 'rejected' }; return adminCtrl.patchUniversityRequest(req, res, next) })
router.post('/', authenticate, authorizeRole('admin'), validateRequest(createUniversitySchema), ctrl.create)

export default router
