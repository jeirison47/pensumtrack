import { serve } from '@hono/node-server'
import app from './app.js'

const port = Number(process.env.PORT) || 4000

serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, () => {
  console.log(`API running on http://localhost:${port}`)
})
