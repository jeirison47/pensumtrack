import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const [totalUsers, totalUniversities, totalCareers, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.university.count(),
    prisma.career.count(),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, displayName: true, createdAt: true },
    }),
  ])

  return NextResponse.json({ data: { totalUsers, totalUniversities, totalCareers, recentUsers } })
}
