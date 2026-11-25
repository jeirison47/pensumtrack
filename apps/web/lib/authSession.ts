import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { resolveEffectivePlan } from '@/lib/plan'
import { isTrialAvailable } from '@/lib/trial'

// Datos del usuario que necesita la respuesta de "sesión iniciada"
export const authUserInclude = {
  plan: { select: { name: true, isDefault: true, features: { select: { featureKey: true } } } },
  profiles: {
    select: { id: true, careerId: true, currentSemester: true },
    take: 1,
    orderBy: { createdAt: 'asc' as const },
  },
}

// Misma respuesta que devuelven login y verify-email: { user, token }
export function authSessionResponse(
  user: {
    id: string; email: string; username: string | null; displayName: string; isAdmin: boolean; createdAt: Date
    planExpiresAt: Date | null
    trialUsedAt: Date | null
    plan: { name: string; isDefault: boolean; features: { featureKey: string }[] } | null
    profiles: { id: string; careerId: string; currentSemester: number }[]
  },
  status = 200,
) {
  const plan = resolveEffectivePlan(user)
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET ?? '', { expiresIn: '7d' })
  return NextResponse.json(
    {
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
    },
    { status },
  )
}
