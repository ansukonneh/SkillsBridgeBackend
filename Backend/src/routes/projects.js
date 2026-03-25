import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { createProjectSchema, updateProjectSchema } from '../validators/project.js'
import * as ctrl from '../controllers/projectsController.js'
import { projectUpload } from '../middleware/upload.js'

const router = Router()

router.use(authenticate)
router.use(authorizeRole('student', 'admin'))

router.post('/', validateRequest(createProjectSchema), ctrl.create)
router.put('/:id', validateRequest(updateProjectSchema), ctrl.update)
router.post('/:id/upload', projectUpload.single('file'), ctrl.uploadFile)
router.delete('/:id', ctrl.remove)
router.get('/user/:userId', ctrl.getByUser)

export default router
