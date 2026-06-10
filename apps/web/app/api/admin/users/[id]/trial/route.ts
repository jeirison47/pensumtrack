import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'
import { getTrialPlan, getTrialDays } from '@/lib/trial'
import { sendTrialActivatedEmail } from '@/lib/email'

// Activa la prueba gratis a un usuario (acción manual del admin, con override:
// se puede otorgar aunque el usuario ya la haya usado antes).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const callerId = getUserId(request)
  if (!callerId) return unauthorized()

  const caller = await prisma.user.findUnique({ where: { id: callerId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const { id } = await params

  const trialPlan = await getTrialPlan()
  if (!trialPlan) {
    return NextResponse.json({ error: 'No hay un plan premium configurado.' }, { status: 400 })
  }

  const trialDays = await getTrialDays()
  const expiresAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)

  const updated = await prisma.user.update({
    where: { id },
    data: { planId: trialPlan.id, planExpiresAt: expiresAt, trialUsedAt: new Date() },
    select: { email: true, displayName: true },
  })

  try {
    await sendTrialActivatedEmail(updated.email, updated.displayName, trialPlan.name, trialDays, expiresAt)
  } catch { /* email no crítico */ }

  return NextResponse.json({ data: { ok: true, planName: trialPlan.name, expiresAt } })
}
