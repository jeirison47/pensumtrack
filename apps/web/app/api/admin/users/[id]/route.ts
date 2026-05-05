import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const { id } = await params

  if (id === userId) return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ data: { id } })
}
