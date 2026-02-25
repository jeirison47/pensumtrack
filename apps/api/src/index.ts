import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// CORS
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL ?? '',
  ].filter(Boolean),
  credentials: true,
}))

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// Routes (se agregan aquí)
// app.route('/api/auth', authRoutes)
// app.route('/api/careers', careerRoutes)
// app.route('/api/progress', progressRoutes)

// 404
app.notFound((c) => c.json({ error: 'Not found' }, 404))

// Error handler
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

const port = Number(process.env.PORT) || 4000

serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, () => {
  console.log(`API running on http://localhost:${port}`)
})
