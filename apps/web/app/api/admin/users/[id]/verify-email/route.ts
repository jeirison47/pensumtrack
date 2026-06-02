import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId } from '@/lib/auth-helper'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const callerId = await getUserId(req)
  if (!callerId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const caller = await prisma.user.findUnique({ where: { id: callerId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return NextResponse.json({ error: 'Prohibido' }, { status: 403 })

  const { id } = await params
  await prisma.user.update({ where: { id }, data: { isEmailVerified: true } })

  return NextResponse.json({ data: { ok: true } })
}
