import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const careers = await prisma.career.findMany({
    include: {
      university: { select: { id: true, name: true, shortName: true } },
      _count: { select: { subjects: true, profiles: true } },
    },
    orderBy: [{ university: { name: 'asc' } }, { name: 'asc' }, { year: 'desc' }],
  })

  return NextResponse.json({ data: careers })
}
