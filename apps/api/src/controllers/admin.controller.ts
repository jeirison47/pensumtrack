import { Context } from 'hono'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { prisma } from '../config/database.js'

// ─── Plans ───────────────────────────────────────────────────────────────────

export const listPlans = async (c: Context) => {
  const plans = await prisma.plan.findMany({
    include: {
      features: true,
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
  return c.json({ data: plans })
}

export const createPlan = async (c: Context) => {
  const body = await c.req.json()
  const parsed = z.object({
    name: z.string().min(1, 'Nombre requerido'),
    description: z.string().optional(),
    features: z.array(z.string()).default([]),
    isDefault: z.boolean().default(false),
  }).safeParse(body)

  if (!parsed.success) return c.json({ error: parsed.error.errors[0].message }, 400)

  const { name, description, features, isDefault } = parsed.data

  const existing = await prisma.plan.findUnique({ where: { name } })
  if (existing) return c.json({ error: 'Ya existe un plan con ese nombre' }, 400)

  if (isDefault) {
    await prisma.plan.updateMany({ data: { isDefault: false } })
  }

  const plan = await prisma.plan.create({
    data: {
      name,
      description,
      isDefault,
      features: { create: features.map((featureKey) => ({ featureKey })) },
    },
    include: { features: true, _count: { select: { users: true } } },
  })

  return c.json({ data: plan }, 201)
}

export const deletePlan = async (c: Context) => {
  const { id } = c.req.param()

  const plan = await prisma.plan.findUnique({ where: { id }, include: { _count: { select: { users: true } } } })
  if (!plan) return c.json({ error: 'Plan no encontrado' }, 404)
  if (plan._count.users > 0) return c.json({ error: 'No se puede eliminar un plan con usuarios asignados' }, 400)

  await prisma.plan.delete({ where: { id } })
  return c.json({ data: { id } })
}

export const resetPassword = async (c: Context) => {
  const { id } = c.req.param()
  const body = await c.req.json()
  const parsed = z.object({
    newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  }).safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.errors[0].message }, 400)

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return c.json({ error: 'Usuario no encontrado' }, 404)

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10)
  await prisma.user.update({ where: { id }, data: { passwordHash } })

  return c.json({ data: { message: 'Contraseña actualizada' } })
}

export const assignPlan = async (c: Context) => {
  const { id } = c.req.param()
  const body = await c.req.json()
  const parsed = z.object({ planId: z.string().nullable() }).safeParse(body)
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400)

  const user = await prisma.user.update({
    where: { id },
    data: { planId: parsed.data.planId },
    select: { id: true, email: true, displayName: true, planId: true },
  })
  return c.json({ data: user })
}

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
      select: {
        id: true, email: true, username: true, displayName: true,
        isAdmin: true, isActive: true, createdAt: true,
        plan: { select: { id: true, name: true } },
      },
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
