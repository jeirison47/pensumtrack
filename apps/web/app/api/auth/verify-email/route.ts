import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const schema = z.object({
  userId: z.string().min(1),
  code: z.string().length(6, 'El código debe tener 6 dígitos'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { userId, code } = result.data

    const verification = await prisma.emailVerification.findFirst({
      where: {
        userId,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    })

    if (!verification) {
      return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 400 })
    }

    // Marcar el OTP como usado y verificar el email en una transacción
    const [, user] = await prisma.$transaction([
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { isEmailVerified: true },
        include: {
          plan: { select: { name: true, features: { select: { featureKey: true } } } },
          profiles: {
            select: { id: true, careerId: true, currentSemester: true },
            take: 1,
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ])

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
    console.error('[verify-email]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
