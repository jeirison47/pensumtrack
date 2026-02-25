import { Context } from 'hono'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../config/database.js'

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
})

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

function signToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET ?? '', { expiresIn: '7d' })
}

export const register = async (c: Context) => {
  const body = await c.req.json()
  const result = registerSchema.safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.errors[0].message }, 400)
  }

  const { email, password, displayName } = result.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return c.json({ error: 'Ya existe una cuenta con ese email' }, 400)
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { email, passwordHash, displayName },
    select: { id: true, email: true, displayName: true, isAdmin: true, createdAt: true },
  })

  const token = signToken(user.id)
  return c.json({ data: { user, token } }, 201)
}

export const login = async (c: Context) => {
  const body = await c.req.json()
  const result = loginSchema.safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.errors[0].message }, 400)
  }

  const { email, password } = result.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.passwordHash) {
    return c.json({ error: 'Credenciales inválidas' }, 401)
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return c.json({ error: 'Credenciales inválidas' }, 401)
  }

  if (!user.isActive) {
    return c.json({ error: 'Cuenta desactivada' }, 403)
  }

  const token = signToken(user.id)
  return c.json({
    data: {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      },
      token,
    },
  })
}

export const me = async (c: Context) => {
  const userId = c.get('userId') as string

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      isAdmin: true,
      createdAt: true,
      settings: {
        select: {
          id: true,
          careerId: true,
          currentSemester: true,
        },
      },
    },
  })

  if (!user) return c.json({ error: 'Usuario no encontrado' }, 404)

  return c.json({ data: user })
}
