import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const { id } = await params
  await prisma.plan.delete({ where: { id } })

  return NextResponse.json({ data: { id } })
}
