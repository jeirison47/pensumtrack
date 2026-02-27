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
            totalCredits: true,
            durationSemesters: true,
            university: { select: { name: true, shortName: true, logoUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ data: profiles })
  } catch (err) {
    console.error('[profiles/list]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
