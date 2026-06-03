import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

async function assertAdmin(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return null
  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  return caller?.isAdmin ? userId : null
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await assertAdmin(req)
  if (!adminId) return forbidden()

  const { id } = await params
  const { name, description, price, features, isDefault } = await req.json()

  const plan = await prisma.plan.update({
    where: { id },
    data: {
      ...(name != null && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(price !== undefined && { price: price != null && price !== '' ? Number(price) : null }),
      ...(isDefault != null && { isDefault: Boolean(isDefault) }),
      ...(features != null && {
        features: {
          deleteMany: {},
          create: (features as string[]).map((key) => ({ featureKey: key })),
        },
      }),
    },
    include: {
      features: { select: { id: true, featureKey: true } },
      _count: { select: { users: true } },
    },
  })

  return NextResponse.json({ data: plan })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await assertAdmin(req)
  if (!adminId) return forbidden()

  const { id } = await params

  const plan = await prisma.plan.findUnique({
    where: { id },
    select: { _count: { select: { users: true } } },
  })
  if (plan && plan._count.users > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: ${plan._count.users} usuario(s) tienen este plan asignado` },
      { status: 400 },
    )
  }

  await prisma.planFeature.deleteMany({ where: { planId: id } })
  await prisma.plan.delete({ where: { id } })

  return NextResponse.json({ data: { id } })
}
