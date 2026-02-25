import { createMiddleware } from 'hono/factory'
import jwt from 'jsonwebtoken'

export const authMiddleware = createMiddleware(async (c, next) => {
  const authorization = c.req.header('Authorization')

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return c.json({ error: 'Token requerido' }, 401)
  }

  const token = authorization.replace('Bearer ', '')

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? '') as { userId: string }
    c.set('userId', payload.userId)
    await next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return c.json({ error: 'Token expirado' }, 401)
    }
    return c.json({ error: 'Token inválido' }, 401)
  }
})
