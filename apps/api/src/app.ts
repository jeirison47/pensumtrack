import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { authRoutes } from './routes/auth.routes.js'
import { careerRoutes } from './routes/career.routes.js'
import { progressRoutes } from './routes/progress.routes.js'
import { universityRoutes } from './routes/university.routes.js'

const app = new Hono()

app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL ?? '',
  ].filter(Boolean),
  credentials: true,
}))

app.get('/health', (c) => c.json({ status: 'ok' }))

app.route('/api/auth', authRoutes)
app.route('/api/universities', universityRoutes)
app.route('/api/careers', careerRoutes)
app.route('/api/progress', progressRoutes)

app.notFound((c) => c.json({ error: 'Not found' }, 404))

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
