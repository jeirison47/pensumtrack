import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'
import { resolveEffectivePlan } from '@/lib/plan'

export async function GET(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      plan: { select: { name: true, features: { select: { featureKey: true } } } },
      profiles: { select: { id: true, careerId: true, currentSemester: true }, take: 1, orderBy: { createdAt: 'asc' } },
    },
  })

  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const plan = resolveEffectivePlan(user)

  return NextResponse.json({
    data: {
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
      settings: user.profiles[0] ?? null,
    },
  })
}
