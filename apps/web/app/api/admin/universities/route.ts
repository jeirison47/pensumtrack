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

  const universities = await prisma.university.findMany({
    include: { _count: { select: { careers: true } } },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ data: universities })
}

const createSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  shortName: z.string().min(1, 'Nombre corto requerido'),
  country: z.string().default('DO'),
  logoUrl: z.string().url().optional().nullable(),
})

export async function POST(request: NextRequest) {
  const userId = await requireAdmin(request)
  if (!userId) return getUserId(request) ? forbidden() : unauthorized()

  const body = await request.json()
  const result = createSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const { name, shortName, country, logoUrl } = result.data

  const existing = await prisma.university.findFirst({ where: { name } })
  if (existing) {
    return NextResponse.json({ error: 'Ya existe una universidad con ese nombre' }, { status: 409 })
  }

  const university = await prisma.university.create({
    data: { name, shortName, country, logoUrl: logoUrl ?? null },
    include: { _count: { select: { careers: true } } },
  })

  return NextResponse.json({ data: university }, { status: 201 })
}
