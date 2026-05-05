import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const schema = z.object({
  email: z.string().email('Email inválido'),
  username: z
    .string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(20, 'El usuario no puede tener más de 20 caracteres')
    .regex(/^[a-z0-9_]+$/, 'El usuario solo puede contener letras minúsculas, números y guiones bajos'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { email, username, password, displayName } = result.data

    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { username } }),
    ])

    if (existingEmail) return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 400 })
    if (existingUsername) return NextResponse.json({ error: 'Ese nombre de usuario ya está en uso' }, { status: 400 })

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
      include: {
        plan: { select: { name: true, features: { select: { featureKey: true } } } },
        profiles: { select: { id: true, careerId: true, currentSemester: true }, take: 1, orderBy: { createdAt: 'asc' } },
      },
    })

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET ?? '', { expiresIn: '7d' })
    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
          planName: user.plan?.name ?? null,
          planFeatures: user.plan?.features.map((f) => f.featureKey) ?? [],
          settings: user.profiles[0] ?? null,
        },
        token,
      },
    }, { status: 201 })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
