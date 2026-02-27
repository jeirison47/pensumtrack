import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  if (!getUserId(request)) return unauthorized()

  const universityId = request.nextUrl.searchParams.get('universityId') ?? undefined

  const careers = await prisma.career.findMany({
    where: { isActive: true, ...(universityId ? { universityId } : {}) },
    select: {
      id: true, name: true, totalCredits: true, durationSemesters: true,
      university: { select: { id: true, name: true, shortName: true, logoUrl: true } },
    },
    orderBy: [{ university: { name: 'asc' } }, { name: 'asc' }],
  })

  return NextResponse.json({ data: careers })
}
