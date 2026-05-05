import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { adminMiddleware } from '../middleware/admin.middleware.js'
import { listUsers, toggleAdmin, toggleActive, getStats, listPlans, createPlan, deletePlan, assignPlan, resetPassword } from '../controllers/admin.controller.js'

const app = new Hono()

app.use('*', authMiddleware)
app.use('*', adminMiddleware)

app.get('/stats', getStats)
app.get('/users', listUsers)
app.patch('/users/:id/admin', toggleAdmin)
app.patch('/users/:id/active', toggleActive)
app.patch('/users/:id/plan', assignPlan)
app.patch('/users/:id/reset-password', resetPassword)

app.get('/plans', listPlans)
app.post('/plans', createPlan)
app.delete('/plans/:id', deletePlan)

export { app as adminRoutes }
