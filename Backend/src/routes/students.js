import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { updateProfileSchema, updateSkillsSchema } from '../validators/student.js'
import { createProjectSchema, updateProjectSchema } from '../validators/project.js'
import * as ctrl from '../controllers/studentsController.js'
import * as skillsCtrl from '../controllers/skillsController.js'
import * as projectsCtrl from '../controllers/projectsController.js'
import { error } from '../utils/response.js'

const router = Router()

router.get('/me', authenticate, authorizeRole('student', 'admin'), ctrl.getMe)
router.put('/me', authenticate, authorizeRole('student', 'admin'), validateRequest(updateProfileSchema), ctrl.putMe)
router.put('/me/skills', authenticate, authorizeRole('student', 'admin'), validateRequest(updateSkillsSchema), skillsCtrl.putMySkills)
router.patch('/me/visibility', authenticate, authorizeRole('student', 'admin'), ctrl.patchMeVisibility)
router.get('/:userId/profile', authenticate, authorizeRole('student', 'admin'), ctrl.getMeProfileByUserId)
router.patch('/:userId/visibility', authenticate, authorizeRole('student', 'admin'), ctrl.patchVisibilityByUserId)
router.delete('/me', authenticate, authorizeRole('student', 'admin'), ctrl.deleteMe)

function ensureOwnUser(req, res, next) {
  const uid = req.params.userId === 'me' ? req.user.id : req.params.userId
  if (uid !== req.user?.id) return error(res, 'Forbidden', 403)
  req.params.userId = req.user.id
  next()
}
router.get('/:userId/projects', authenticate, authorizeRole('student', 'admin'), ensureOwnUser, projectsCtrl.getByUser)
router.post('/:userId/projects', authenticate, authorizeRole('student', 'admin'), validateRequest(createProjectSchema), ensureOwnUser, projectsCtrl.create)
router.patch('/:userId/projects/:projectId', authenticate, authorizeRole('student', 'admin'), validateRequest(updateProjectSchema), ensureOwnUser, (req, res, next) => { req.params.id = req.params.projectId; return projectsCtrl.update(req, res, next) })
router.delete('/:userId/projects/:projectId', authenticate, authorizeRole('student', 'admin'), ensureOwnUser, (req, res, next) => { req.params.id = req.params.projectId; return projectsCtrl.remove(req, res, next) })

router.get('/:id', ctrl.getPublicProfile)

export default router
