import { NextRequest, NextResponse } from 'next/server'
import { getUserId, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'
import { sendRequestStatusEmail } from '@/lib/email'

async function assertAdmin(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return null
  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  return caller?.isAdmin ? userId : null
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertAdmin(req)) return forbidden()

  const { id } = await params
  const { status, adminNotes } = await req.json()

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const upgradeReq = await prisma.planUpgradeRequest.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, displayName: true, planId: true, planExpiresAt: true } },
      plan: { select: { id: true, name: true, isDefault: true } },
    },
  })
  if (!upgradeReq) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.planUpgradeRequest.update({
      where: { id },
      data: { status, adminNotes: adminNotes ?? null },
    })

    if (status === 'APPROVED') {
      // El plan gratis/por defecto no vence; los planes de pago duran 30 días.
      let expiresAt: Date | null = null
      if (!upgradeReq.plan.isDefault) {
        // Si ya tiene el mismo plan vigente, extender desde su vencimiento;
        // si no, contar desde hoy.
        const current = upgradeReq.user.planExpiresAt
        const samePlan = upgradeReq.user.planId === upgradeReq.planId
        const base = samePlan && current && current.getTime() > Date.now() ? current : new Date()
        expiresAt = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000)
      }

      await tx.user.update({
        where: { id: upgradeReq.userId },
        data: { planId: upgradeReq.planId, planExpiresAt: expiresAt },
      })
    }
  })

  try {
    await sendRequestStatusEmail(
      upgradeReq.user.email,
      upgradeReq.user.displayName,
      `Plan ${upgradeReq.plan.name}`,
      status === 'APPROVED' ? 'COMPLETED' : 'REJECTED',
      adminNotes,
    )
  } catch { /* email no crítico */ }

  return NextResponse.json({ data: { ok: true } })
}
