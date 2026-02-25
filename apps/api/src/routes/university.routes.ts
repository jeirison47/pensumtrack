import { Hono } from 'hono'
import { getUniversities, getUniversityById } from '../controllers/university.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const universityRoutes = new Hono()

universityRoutes.use('*', authMiddleware)

universityRoutes.get('/', getUniversities)
universityRoutes.get('/:id', getUniversityById)

export { universityRoutes }
