import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  if (!getUserId(request)) return unauthorized()

  const universityId = request.nextUrl.searchParams.get('universityId') ?? undefined

  const careers = await prisma.career.findMany({
    where: { isActive: true, ...(universityId ? { universityId } : {}) },
    include: {
      university: { select: { id: true, name: true, shortName: true, logoUrl: true } },
      pensums: {
        where: { isActive: true },
        orderBy: { year: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ university: { name: 'asc' } }, { name: 'asc' }],
  })

  // Flatten the active pensum fields into the career response
  const data = careers.map((c) => {
    const activePensum = c.pensums[0]
    return {
      id: c.id,
      name: c.name,
      university: c.university,
      totalCredits: activePensum?.totalCredits ?? c.totalCredits ?? 0,
      durationSemesters: activePensum?.durationSemesters ?? c.durationSemesters ?? 0,
      year: activePensum?.year ?? c.year ?? null,
      periodType: activePensum?.periodType ?? c.periodType ?? 'semester',
      activePensumId: activePensum?.id ?? null,
    }
  })

  return NextResponse.json({ data })
}
