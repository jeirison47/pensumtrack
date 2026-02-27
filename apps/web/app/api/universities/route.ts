import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  if (!getUserId(request)) return unauthorized()

  const universities = await prisma.university.findMany({
    where: { isActive: true },
    select: {
      id: true, name: true, shortName: true, country: true, logoUrl: true,
      _count: { select: { careers: { where: { isActive: true } } } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ data: universities })
}
