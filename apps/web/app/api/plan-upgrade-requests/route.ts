import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req)
    if (!userId) return unauthorized()

    const form = await req.formData()
    const planId = form.get('planId') as string
    const method = form.get('method') as string
    const confirmMethod = (form.get('confirmMethod') as string) || 'app'
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
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json(
          { error: 'La subida de comprobantes no está configurada. Envíalo por correo o WhatsApp.' },
          { status: 503 },
        )
      }
      const ext = file.name.split('.').pop()
      const blob = await put(`comprobantes/${userId}-${Date.now()}.${ext}`, file, {
        access: 'private',
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
      data: { userId, planId, method, confirmMethod, proofUrl, proofName },
    })

    return NextResponse.json({ data: request }, { status: 201 })
  } catch (err) {
    console.error('[plan-upgrade-requests] POST error:', err)
    return NextResponse.json(
      {
        error: 'No se pudo registrar la solicitud. Inténtalo de nuevo o envía el comprobante por correo/WhatsApp.',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
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
