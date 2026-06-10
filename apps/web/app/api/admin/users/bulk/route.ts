import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'
import { getTrialPlan, getTrialDays } from '@/lib/trial'
import { sendTrialActivatedEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const body = await request.json()
  const { ids, action, planId } = body

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'IDs requeridos' }, { status: 400 })
  }

  const validActions = ['delete', 'activate', 'deactivate', 'assign_plan', 'trial']
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  }

  // Exclude the caller from batch operations to prevent self-modification
  const safeIds = (ids as string[]).filter((id) => id !== userId)

  if (action === 'delete') {
    await prisma.user.deleteMany({ where: { id: { in: safeIds } } })
  } else if (action === 'activate') {
    await prisma.user.updateMany({ where: { id: { in: safeIds } }, data: { isActive: true } })
  } else if (action === 'deactivate') {
    await prisma.user.updateMany({ where: { id: { in: safeIds } }, data: { isActive: false } })
  } else if (action === 'assign_plan') {
    await prisma.user.updateMany({ where: { id: { in: safeIds } }, data: { planId: planId ?? null } })
  } else if (action === 'trial') {
    const trialPlan = await getTrialPlan()
    if (!trialPlan) return NextResponse.json({ error: 'No hay un plan premium configurado.' }, { status: 400 })
    const trialDays = await getTrialDays()
    const expiresAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)

    await prisma.user.updateMany({
      where: { id: { in: safeIds } },
      data: { planId: trialPlan.id, planExpiresAt: expiresAt, trialUsedAt: new Date() },
    })

    // Notificar a cada usuario (no crítico si algún correo falla)
    const targets = await prisma.user.findMany({ where: { id: { in: safeIds } }, select: { email: true, displayName: true } })
    for (const u of targets) {
      try { await sendTrialActivatedEmail(u.email, u.displayName, trialPlan.name, trialDays, expiresAt) } catch { /* noop */ }
    }
  }

  return NextResponse.json({ data: { affected: safeIds.length } })
}
