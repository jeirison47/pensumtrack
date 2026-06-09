import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { resolveEffectivePlan } from '@/lib/plan'
import { isTrialAvailable } from '@/lib/trial'

const schema = z.object({
  pendingId: z.string().optional(),
  userId: z.string().optional(),
  code: z.string().length(6, 'El código debe tener 6 dígitos'),
})

const userInclude = {
  plan: { select: { name: true, isDefault: true, features: { select: { featureKey: true } } } },
  profiles: {
    select: { id: true, careerId: true, currentSemester: true },
    take: 1,
    orderBy: { createdAt: 'asc' as const },
  },
}

function buildResponse(user: {
  id: string; email: string; username: string | null; displayName: string; isAdmin: boolean; createdAt: Date
  planExpiresAt: Date | null
  trialUsedAt: Date | null
  plan: { name: string; isDefault: boolean; features: { featureKey: string }[] } | null
  profiles: { id: string; careerId: string; currentSemester: number }[]
}) {
  const plan = resolveEffectivePlan(user)
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
        planName: plan.planName,
        planFeatures: plan.planFeatures,
        planExpiresAt: plan.planExpiresAt,
        planExpired: plan.planExpired,
        trialAvailable: isTrialAvailable(user),
        settings: user.profiles[0] ?? null,
      },
      token,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { pendingId, userId, code } = result.data

    // ─── Flujo nuevo: registro pendiente → crear el User real ──────────────────
    if (pendingId) {
      const pending = await prisma.pendingRegistration.findUnique({ where: { id: pendingId } })
      if (!pending || pending.code !== code || pending.expiresAt <= new Date()) {
        return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 400 })
      }

      // Por si el email/usuario fue tomado mientras tanto
      const [emailTaken, usernameTaken] = await Promise.all([
        prisma.user.findUnique({ where: { email: pending.email }, select: { id: true } }),
        prisma.user.findUnique({ where: { username: pending.username }, select: { id: true } }),
      ])
      if (emailTaken) return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 400 })
      if (usernameTaken) return NextResponse.json({ error: 'Ese nombre de usuario ya está en uso' }, { status: 400 })

      const defaultPlan = await prisma.plan.findFirst({ where: { isDefault: true }, select: { id: true } })

      const user = await prisma.user.create({
        data: {
          email: pending.email,
          username: pending.username,
          passwordHash: pending.passwordHash,
          displayName: pending.displayName,
          isEmailVerified: true,
          ...(defaultPlan ? { planId: defaultPlan.id } : {}),
        },
        include: userInclude,
      })

      await prisma.pendingRegistration.delete({ where: { id: pending.id } }).catch(() => {})

      return buildResponse(user)
    }

    // ─── Flujo legacy: usuario ya creado, sin verificar (cuentas previas) ───────
    if (!userId) {
      return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
    }

    const verification = await prisma.emailVerification.findFirst({
      where: { userId, code, used: false, expiresAt: { gt: new Date() } },
    })
    if (!verification) {
      return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 400 })
    }

    const [, user] = await prisma.$transaction([
      prisma.emailVerification.update({ where: { id: verification.id }, data: { used: true } }),
      prisma.user.update({ where: { id: userId }, data: { isEmailVerified: true }, include: userInclude }),
    ])

    return buildResponse(user)
  } catch (err) {
    console.error('[verify-email]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
