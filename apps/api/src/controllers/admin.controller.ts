import { Context } from 'hono'
import { z } from 'zod'
import { prisma } from '../config/database.js'

// ─── Users ───────────────────────────────────────────────────────────────────

export const listUsers = async (c: Context) => {
  const q = c.req.query('q') ?? ''
  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const take = 20
  const skip = (page - 1) * take

  const where = q
    ? { OR: [{ email: { contains: q, mode: 'insensitive' as const } }, { displayName: { contains: q, mode: 'insensitive' as const } }] }
    : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, email: true, displayName: true, isAdmin: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.user.count({ where }),
  ])

  return c.json({ data: { users, total, page, pages: Math.ceil(total / take) } })
}

export const toggleAdmin = async (c: Context) => {
  const { id } = c.req.param()
  const body = await c.req.json().catch(() => null)
  const parsed = z.object({ isAdmin: z.boolean() }).safeParse(body)
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400)

  const user = await prisma.user.update({
    where: { id },
    data: { isAdmin: parsed.data.isAdmin },
    select: { id: true, email: true, displayName: true, isAdmin: true },
  })
  return c.json({ data: user })
}

export const toggleActive = async (c: Context) => {
  const { id } = c.req.param()
  const body = await c.req.json().catch(() => null)
  const parsed = z.object({ isActive: z.boolean() }).safeParse(body)
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400)

  const user = await prisma.user.update({
    where: { id },
    data: { isActive: parsed.data.isActive },
    select: { id: true, email: true, displayName: true, isActive: true },
  })
  return c.json({ data: user })
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export const getStats = async (c: Context) => {
  const [totalUsers, totalUniversities, totalCareers, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.university.count(),
    prisma.career.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, email: true, displayName: true, createdAt: true },
    }),
  ])

  return c.json({ data: { totalUsers, totalUniversities, totalCareers, recentUsers } })
}
