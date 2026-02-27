import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      career: { include: { subjects: { orderBy: [{ semester: 'asc' }, { code: 'asc' }] } } },
      subjects: true,
      preselections: { orderBy: { period: 'asc' } },
    },
  })

  return NextResponse.json({ data: profile ?? null })
}
