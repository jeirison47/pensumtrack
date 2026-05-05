import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

const PAGE_SIZE = 10

export async function GET(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: 'insensitive' as const } },
          { displayName: { contains: q, mode: 'insensitive' as const } },
          { username: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
        plan: { select: { id: true, name: true } },
      },
    }),
  ])

  return NextResponse.json({
    data: {
      users,
      total,
      page,
      pages: Math.ceil(total / PAGE_SIZE),
    },
  })
}
