import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const profile = await prisma.studentProfile.findFirst({
    where: { userId },
    include: {
      career: {
        include: {
          university: { select: { id: true, name: true, shortName: true, logoUrl: true } },
          subjects: { orderBy: [{ semester: 'asc' }, { code: 'asc' }] },
        },
      },
      pensum: {
        include: {
          subjects: { orderBy: [{ semester: 'asc' }, { code: 'asc' }] },
        },
      },
      subjects: true,
      preselections: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!profile) return NextResponse.json({ data: null })

  // Normalize preselections: add label field (from label ?? period)
  const normalized = {
    ...profile,
    preselections: profile.preselections.map((p) => ({
      ...p,
      label: p.label ?? p.period ?? '',
      startDate: p.startDate?.toISOString() ?? null,
      endDate: p.endDate?.toISOString() ?? null,
    })),
  }

  return NextResponse.json({ data: normalized })
}
