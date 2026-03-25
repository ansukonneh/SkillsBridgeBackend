import { Router } from 'express'
import * as ctrl from '../controllers/exploreController.js'
import { getPublicProfile } from '../controllers/studentsController.js'

const router = Router()

router.get('/students', ctrl.getStudents)
router.get('/profiles/:id', getPublicProfile)

export default router
