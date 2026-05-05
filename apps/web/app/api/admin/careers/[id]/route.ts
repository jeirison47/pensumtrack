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
  universityId: z.string().min(1).optional(),
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

  const career = await prisma.career.update({
    where: { id },
    data: result.data,
    include: {
      university: { select: { id: true, name: true, shortName: true } },
      _count: { select: { pensums: true, profiles: true } },
    },
  })

  return NextResponse.json({ data: career })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await requireAdmin(request)
  if (!userId) return getUserId(request) ? forbidden() : unauthorized()

  const { id } = await params

  const pensumsCount = await prisma.pensum.count({ where: { careerId: id } })
  if (pensumsCount > 0) {
    return NextResponse.json(
      { error: `No puedes eliminar una carrera que tiene ${pensumsCount} pensum(s). Elimina primero los pensums.` },
      { status: 400 },
    )
  }

  await prisma.career.delete({ where: { id } })
  return NextResponse.json({ data: { id } })
}
