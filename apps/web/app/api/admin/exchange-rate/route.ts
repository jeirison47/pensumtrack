import { NextRequest, NextResponse } from 'next/server'
import { getUserId, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

async function assertAdmin(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return false
  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  return !!caller?.isAdmin
}

// Obtener tasa guardada en BD
export async function GET(req: NextRequest) {
  if (!await assertAdmin(req)) return forbidden()
  const config = await prisma.appConfig.findUnique({ where: { key: 'usd_dop_rate' } })
  return NextResponse.json({
    data: config ? { rate: parseFloat(config.value), updatedAt: config.updatedAt } : null,
  })
}

// Guardar tasa en BD
export async function POST(req: NextRequest) {
  if (!await assertAdmin(req)) return forbidden()
  const { rate } = await req.json()
  if (!rate || isNaN(Number(rate)) || Number(rate) <= 0) {
    return NextResponse.json({ error: 'Tasa inválida' }, { status: 400 })
  }
  await prisma.appConfig.upsert({
    where: { key: 'usd_dop_rate' },
    update: { value: String(Number(rate)) },
    create: { key: 'usd_dop_rate', value: String(Number(rate)) },
  })
  return NextResponse.json({ data: { ok: true, rate: Number(rate) } })
}

// Consultar tasa actual desde API externa (para previsualizar antes de guardar)
export async function PUT(req: NextRequest) {
  if (!await assertAdmin(req)) return forbidden()
  try {
    const res = await fetch('https://open.exchangerate-api.com/v6/latest/USD')
    const json = await res.json()
    const rate = json?.rates?.DOP as number | undefined
    if (!rate) throw new Error('No se obtuvo la tasa')
    return NextResponse.json({ data: { rate, updatedAt: json.time_last_update_utc } })
  } catch {
    return NextResponse.json({ error: 'No se pudo obtener la tasa actual' }, { status: 502 })
  }
}
