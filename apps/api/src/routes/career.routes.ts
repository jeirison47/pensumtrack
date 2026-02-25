import { Hono } from 'hono'
import { getCareers, getCareerById } from '../controllers/career.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const careerRoutes = new Hono()

careerRoutes.use('*', authMiddleware)

careerRoutes.get('/', getCareers)
careerRoutes.get('/:id', getCareerById)

export { careerRoutes }
