import { Context } from 'hono'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../config/database.js'

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z
    .string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(20, 'El usuario no puede tener más de 20 caracteres')
    .regex(/^[a-z0-9_]+$/, 'El usuario solo puede contener letras minúsculas, números y guiones bajos'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
})

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email o usuario requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

function signToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET ?? '', { expiresIn: '7d' })
}

function buildUserPayload(user: {
  id: string
  email: string
  username: string | null
  displayName: string
  isAdmin: boolean
  createdAt: Date
  plan?: { name: string; features: { featureKey: string }[] } | null
  settings?: { id: string; careerId: string; currentSemester: number } | null
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
    planName: user.plan?.name ?? null,
    planFeatures: user.plan?.features.map((f) => f.featureKey) ?? [],
    settings: user.settings ?? null,
  }
}

export const register = async (c: Context) => {
  const body = await c.req.json()
  const result = registerSchema.safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.errors[0].message }, 400)
  }

  const { email, username, password, displayName } = result.data

  const [existingEmail, existingUsername] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { username } }),
  ])

  if (existingEmail) return c.json({ error: 'Ya existe una cuenta con ese email' }, 400)
  if (existingUsername) return c.json({ error: 'Ese nombre de usuario ya está en uso' }, 400)

  const defaultPlan = await prisma.plan.findFirst({ where: { isDefault: true } })
  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      displayName,
      ...(defaultPlan ? { planId: defaultPlan.id } : {}),
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      isAdmin: true,
      createdAt: true,
      plan: { select: { name: true, features: { select: { featureKey: true } } } },
      settings: { select: { id: true, careerId: true, currentSemester: true } },
    },
  })

  const token = signToken(user.id)
  return c.json({ data: { user: buildUserPayload(user), token } }, 201)
}

export const login = async (c: Context) => {
  const body = await c.req.json()
  const result = loginSchema.safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.errors[0].message }, 400)
  }

  const { identifier, password } = result.data

  const user = await prisma.user.findFirst({
    where: identifier.includes('@')
      ? { email: identifier }
      : { username: identifier },
    include: {
      plan: { select: { name: true, features: { select: { featureKey: true } } } },
      settings: { select: { id: true, careerId: true, currentSemester: true } },
    },
  })

  if (!user || !user.passwordHash) {
    return c.json({ error: 'Credenciales inválidas' }, 401)
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return c.json({ error: 'Credenciales inválidas' }, 401)

  if (!user.isActive) return c.json({ error: 'Cuenta desactivada' }, 403)

  const token = signToken(user.id)
  return c.json({ data: { user: buildUserPayload(user), token } })
}

export const me = async (c: Context) => {
  const userId = c.get('userId') as string

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      plan: { select: { name: true, features: { select: { featureKey: true } } } },
      settings: { select: { id: true, careerId: true, currentSemester: true } },
    },
  })

  if (!user) return c.json({ error: 'Usuario no encontrado' }, 404)

  return c.json({ data: buildUserPayload(user) })
}
