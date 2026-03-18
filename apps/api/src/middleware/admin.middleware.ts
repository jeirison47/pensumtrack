import { createMiddleware } from 'hono/factory'
import { prisma } from '../config/database.js'

export const adminMiddleware = createMiddleware(async (c, next) => {
  const userId = c.get('userId') as string
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!user?.isAdmin) return c.json({ error: 'Acceso restringido a administradores' }, 403)
  await next()
})
