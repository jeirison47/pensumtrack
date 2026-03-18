import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { adminMiddleware } from '../middleware/admin.middleware.js'
import { listUsers, toggleAdmin, toggleActive, getStats } from '../controllers/admin.controller.js'

const app = new Hono()

app.use('*', authMiddleware)
app.use('*', adminMiddleware)

app.get('/stats', getStats)
app.get('/users', listUsers)
app.patch('/users/:id/admin', toggleAdmin)
app.patch('/users/:id/active', toggleActive)

export { app as adminRoutes }
