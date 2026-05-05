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

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  shortName: z.string().min(1).optional(),
  country: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await requireAdmin(request)
  if (!userId) return getUserId(request) ? forbidden() : unauthorized()

  const { id } = await params
  const body = await request.json()
  const result = updateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const university = await prisma.university.update({
    where: { id },
    data: result.data,
    include: { _count: { select: { careers: true } } },
  })

  return NextResponse.json({ data: university })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await requireAdmin(request)
  if (!userId) return getUserId(request) ? forbidden() : unauthorized()

  const { id } = await params

  const careersCount = await prisma.career.count({ where: { universityId: id } })
  if (careersCount > 0) {
    return NextResponse.json(
      { error: `No puedes eliminar una universidad que tiene ${careersCount} carrera(s). Elimina primero las carreras.` },
      { status: 400 },
    )
  }

  await prisma.university.delete({ where: { id } })
  return NextResponse.json({ data: { id } })
}
