import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const plans = await prisma.plan.findMany({
    include: {
      features: { select: { id: true, featureKey: true } },
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ data: plans })
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const { name, description, price, features, isDefault } = await request.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'El nombre del plan es requerido' }, { status: 400 })
  }

  const plan = await prisma.plan.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      price: price != null ? Number(price) : null,
      isDefault: Boolean(isDefault),
      features: {
        create: (features ?? []).map((key: string) => ({ featureKey: key.trim() })),
      },
    },
    include: {
      features: { select: { id: true, featureKey: true } },
      _count: { select: { users: true } },
    },
  })

  return NextResponse.json({ data: plan }, { status: 201 })
}
