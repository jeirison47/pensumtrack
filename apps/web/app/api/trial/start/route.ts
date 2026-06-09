import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'
import { resolveEffectivePlan } from '@/lib/plan'
import { getTrialPlan, isTrialAvailable, TRIAL_DAYS } from '@/lib/trial'

export async function POST(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, trialUsedAt: true, planExpiresAt: true, plan: { select: { isDefault: true } } },
  })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  if (!isTrialAvailable(user)) {
    return NextResponse.json(
      { error: user.trialUsedAt ? 'Ya usaste tu prueba gratis.' : 'Ya tienes un plan activo.' },
      { status: 400 },
    )
  }

  const trialPlan = await getTrialPlan()
  if (!trialPlan) {
    return NextResponse.json({ error: 'No hay un plan premium configurado.' }, { status: 400 })
  }

  const expiresAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000)

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { planId: trialPlan.id, planExpiresAt: expiresAt, trialUsedAt: new Date() },
    include: { plan: { select: { name: true, isDefault: true, features: { select: { featureKey: true } } } } },
  })

  const plan = resolveEffectivePlan(updated)
  return NextResponse.json({
    data: {
      planName: plan.planName,
      planFeatures: plan.planFeatures,
      planExpiresAt: plan.planExpiresAt,
      planExpired: plan.planExpired,
      trialAvailable: false,
    },
  })
}
