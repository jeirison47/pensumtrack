import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const { id } = await params
  const { planId } = await request.json()

  const user = await prisma.user.update({
    where: { id },
    data: { planId: planId ?? null },
    select: { id: true, planId: true, plan: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ data: user })
}
