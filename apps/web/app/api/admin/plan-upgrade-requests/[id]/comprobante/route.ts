import { NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/blob'
import { getUserId, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

async function assertAdmin(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return false
  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  return !!caller?.isAdmin
}

// Sirve el comprobante (blob privado) de forma autenticada para el admin.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertAdmin(req)) return forbidden()

  const { id } = await params
  const row = await prisma.planUpgradeRequest.findUnique({
    where: { id },
    select: { proofUrl: true },
  })
  if (!row?.proofUrl) return NextResponse.json({ error: 'Sin comprobante' }, { status: 404 })

  const blob = await get(row.proofUrl, { access: 'private' })
  if (!blob || blob.statusCode !== 200) {
    return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 })
  }

  return new Response(blob.stream, {
    headers: {
      'Content-Type': blob.blob.contentType || 'application/octet-stream',
      'Cache-Control': 'private, no-store',
    },
  })
}
