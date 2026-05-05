import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const schema = z.object({
  identifier: z.string().min(1, 'Email o usuario requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { identifier, password } = result.data

    const user = await prisma.user.findFirst({
      where: identifier.includes('@') ? { email: identifier } : { username: identifier },
      include: {
        plan: { select: { name: true, features: { select: { featureKey: true } } } },
        profiles: { select: { id: true, careerId: true, currentSemester: true }, take: 1, orderBy: { createdAt: 'asc' } },
      },
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Cuenta desactivada' }, { status: 403 })
    }

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
    })
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
