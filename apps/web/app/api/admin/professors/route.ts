import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

const schema = z.object({
  name: z.string().min(2),
  bio: z.string().optional(),
  photoUrl: z.string().url().optional(),
})

export async function GET(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()
  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const professors = await prisma.professor.findMany({
    include: {
      teachings: { include: { university: { select: { id: true, name: true, shortName: true } } } },
      _count: { select: { ratings: true, comments: true } },
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ data: professors })
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()
  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const body = await request.json()
  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })

  const professor = await prisma.professor.create({ data: { ...result.data, status: 'ACTIVE' } })
  return NextResponse.json({ data: professor }, { status: 201 })
}
