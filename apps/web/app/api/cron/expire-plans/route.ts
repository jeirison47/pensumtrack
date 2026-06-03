import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendPlanExpiringEmail, sendPlanExpiredEmail } from '@/lib/email'

const DAY = 24 * 60 * 60 * 1000

// Cron diario de Vercel. Protegido con CRON_SECRET (Vercel envía
// "Authorization: Bearer <CRON_SECRET>" automáticamente).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  const now = new Date()

  // ─── 1. Bajar planes ya vencidos al plan por defecto ───────────────────────
  const defaultPlan = await prisma.plan.findFirst({ where: { isDefault: true }, select: { id: true } })

  const expired = await prisma.user.findMany({
    where: { planExpiresAt: { lt: now, not: null } },
    select: { id: true, email: true, displayName: true, plan: { select: { name: true } } },
  })

  let downgraded = 0
  for (const u of expired) {
    await prisma.user.update({
      where: { id: u.id },
      data: { planId: defaultPlan?.id ?? null, planExpiresAt: null },
    })
    downgraded++
    try {
      await sendPlanExpiredEmail(u.email, u.displayName, u.plan?.name ?? 'Premium')
    } catch { /* email no crítico */ }
  }

  // ─── 2. Avisar a quienes vencen en 3 días o en 1 día (último día) ──────────
  const soon = await prisma.user.findMany({
    where: { planExpiresAt: { gte: now, lte: new Date(now.getTime() + 3 * DAY) } },
    select: { id: true, email: true, displayName: true, planExpiresAt: true, plan: { select: { name: true } } },
  })

  let reminded = 0
  for (const u of soon) {
    if (!u.planExpiresAt) continue
    const daysLeft = Math.ceil((u.planExpiresAt.getTime() - now.getTime()) / DAY)
    if (daysLeft === 3 || daysLeft === 1) {
      try {
        await sendPlanExpiringEmail(u.email, u.displayName, u.plan?.name ?? 'Premium', u.planExpiresAt, daysLeft)
        reminded++
      } catch { /* email no crítico */ }
    }
  }

  return NextResponse.json({ data: { downgraded, reminded, checkedSoon: soon.length } })
}
