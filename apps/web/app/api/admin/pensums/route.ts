import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const pensums = await prisma.pensum.findMany({
    include: {
      career: {
        include: {
          university: { select: { id: true, name: true, shortName: true } },
        },
      },
      _count: { select: { subjects: true, profiles: true } },
    },
    orderBy: [{ career: { university: { name: 'asc' } } }, { career: { name: 'asc' } }, { year: 'desc' }],
  })

  // Shape to match existing CareerVersion interface
  const data = pensums.map((p) => ({
    id: p.id,
    name: p.career.name,
    year: p.year,
    periodType: p.periodType,
    totalCredits: p.totalCredits,
    durationSemesters: p.durationSemesters,
    isActive: p.isActive,
    createdAt: p.createdAt,
    careerId: p.careerId,
    university: p.career.university,
    _count: p._count,
  }))

  return NextResponse.json({ data })
}
