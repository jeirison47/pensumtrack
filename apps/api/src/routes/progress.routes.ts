import { Hono } from 'hono'
import {
  getMyProgress,
  upsertProfile,
  updateSubject,
  updatePreselection,
} from '../controllers/progress.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const progressRoutes = new Hono()

progressRoutes.use('*', authMiddleware)

progressRoutes.get('/me', getMyProgress)
progressRoutes.post('/profile', upsertProfile)
progressRoutes.put('/subject', updateSubject)
progressRoutes.put('/preselection', updatePreselection)

export { progressRoutes }
