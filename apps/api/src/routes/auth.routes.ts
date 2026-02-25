import { Hono } from 'hono'
import { register, login, me } from '../controllers/auth.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const authRoutes = new Hono()

authRoutes.post('/register', register)
authRoutes.post('/login', login)
authRoutes.get('/me', authMiddleware, me)

export { authRoutes }
