import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      plan: { select: { name: true, features: { select: { featureKey: true } } } },
      profiles: { select: { id: true, careerId: true, currentSemester: true }, take: 1, orderBy: { createdAt: 'asc' } },
    },
  })

  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  return NextResponse.json({
    data: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      planName: user.plan?.name ?? null,
      planFeatures: user.plan?.features.map((f) => f.featureKey) ?? [],
      settings: user.profiles[0] ?? null,
    },
  })
}
