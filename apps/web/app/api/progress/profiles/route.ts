import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) return unauthorized()

    const profiles = await prisma.studentProfile.findMany({
      where: { userId },
      include: {
        career: {
          select: {
            id: true,
            name: true,
            university: { select: { name: true, shortName: true, logoUrl: true } },
          },
        },
        pensum: {
          select: {
            id: true,
            year: true,
            totalCredits: true,
            durationSemesters: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Flatten pensum fields into the expected ProfileSummary shape
    const data = profiles.map((p) => ({
      id: p.id,
      careerId: p.careerId,
      pensumId: p.pensumId,
      currentSemester: p.currentSemester,
      isActive: p.isActive,
      career: {
        id: p.career.id,
        name: p.career.name,
        totalCredits: p.pensum?.totalCredits ?? 0,
        durationSemesters: p.pensum?.durationSemesters ?? 0,
        university: p.career.university,
      },
    }))

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[profiles/list]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
