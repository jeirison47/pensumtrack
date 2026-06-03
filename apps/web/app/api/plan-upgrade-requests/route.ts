import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return unauthorized()

  const form = await req.formData()
  const planId = form.get('planId') as string
  const method = form.get('method') as string
  const file = form.get('proof') as File | null

  if (!planId || !method) {
    return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } })
  if (!plan) return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })

  let proofUrl: string | null = null
  let proofName: string | null = null

  if (file && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo no puede superar 5 MB' }, { status: 400 })
    }
    const ext = file.name.split('.').pop()
    const blob = await put(`comprobantes/${userId}-${Date.now()}.${ext}`, file, {
      access: 'public',
      contentType: file.type,
    })
    proofUrl = blob.url
    proofName = file.name
  }

  const existing = await prisma.planUpgradeRequest.findFirst({
    where: { userId, status: 'PENDING' },
  })
  if (existing) {
    return NextResponse.json({ error: 'Ya tienes una solicitud pendiente' }, { status: 400 })
  }

  const request = await prisma.planUpgradeRequest.create({
    data: { userId, planId, method, proofUrl, proofName },
  })

  return NextResponse.json({ data: request }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return unauthorized()

  const requests = await prisma.planUpgradeRequest.findMany({
    where: { userId },
    include: { plan: { select: { name: true, price: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: requests })
}
