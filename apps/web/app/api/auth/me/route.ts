import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, displayName: true, isAdmin: true, createdAt: true,
      settings: { select: { id: true, careerId: true, currentSemester: true } },
    },
  })

  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  return NextResponse.json({ data: user })
}
