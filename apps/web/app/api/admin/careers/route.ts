import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

async function requireAdmin(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return null
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  return user?.isAdmin ? userId : null
}

export async function GET(request: NextRequest) {
  const userId = await requireAdmin(request)
  if (!userId) return getUserId(request) ? forbidden() : unauthorized()

  const universityId = request.nextUrl.searchParams.get('universityId') ?? undefined

  const careers = await prisma.career.findMany({
    where: universityId ? { universityId } : undefined,
    include: {
      university: { select: { id: true, name: true, shortName: true } },
      _count: { select: { pensums: true, profiles: true } },
    },
    orderBy: [{ university: { name: 'asc' } }, { name: 'asc' }],
  })

  return NextResponse.json({ data: careers })
}

const createSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  universityId: z.string().min(1, 'Universidad requerida'),
})

export async function POST(request: NextRequest) {
  const userId = await requireAdmin(request)
  if (!userId) return getUserId(request) ? forbidden() : unauthorized()

  const body = await request.json()
  const result = createSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const { name, universityId } = result.data

  const existing = await prisma.career.findFirst({ where: { name, universityId } })
  if (existing) {
    return NextResponse.json({ error: 'Ya existe una carrera con ese nombre en esta universidad' }, { status: 409 })
  }

  const career = await prisma.career.create({
    data: { name, universityId },
    include: {
      university: { select: { id: true, name: true, shortName: true } },
      _count: { select: { pensums: true, profiles: true } },
    },
  })

  return NextResponse.json({ data: career }, { status: 201 })
}
