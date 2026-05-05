import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const { id } = await params
  const { isActive } = await request.json()

  const pensum = await prisma.pensum.update({
    where: { id },
    data: { isActive: Boolean(isActive) },
    select: { id: true, isActive: true },
  })

  return NextResponse.json({ data: pensum })
}
