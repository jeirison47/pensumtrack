import { NextRequest, NextResponse } from 'next/server'
import { getUserId, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

async function assertAdmin(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return null
  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  return caller?.isAdmin ? userId : null
}

export async function GET(req: NextRequest) {
  if (!await assertAdmin(req)) return forbidden()

  const requests = await prisma.planUpgradeRequest.findMany({
    include: {
      user: { select: { id: true, displayName: true, email: true, username: true, planId: true } },
      plan: { select: { id: true, name: true, price: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: requests })
}
