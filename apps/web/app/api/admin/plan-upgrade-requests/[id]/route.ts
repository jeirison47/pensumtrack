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
      user: { select: { id: true, email: true, displayName: true } },
      plan: { select: { id: true, name: true } },
    },
  })
  if (!upgradeReq) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.planUpgradeRequest.update({
      where: { id },
      data: { status, adminNotes: adminNotes ?? null },
    })

    if (status === 'APPROVED') {
      await tx.user.update({
        where: { id: upgradeReq.userId },
        data: { planId: upgradeReq.planId },
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
