import { NextRequest, NextResponse } from 'next/server'
import { getUserId, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'
import { getTrialDays } from '@/lib/trial'

async function assertAdmin(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return false
  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  return !!caller?.isAdmin
}

export async function GET(req: NextRequest) {
  if (!await assertAdmin(req)) return forbidden()
  return NextResponse.json({ data: { days: await getTrialDays() } })
}

export async function POST(req: NextRequest) {
  if (!await assertAdmin(req)) return forbidden()
  const { days } = await req.json()
  const n = Number(days)
  if (!Number.isInteger(n) || n < 1 || n > 365) {
    return NextResponse.json({ error: 'Días inválidos (1 a 365)' }, { status: 400 })
  }
  await prisma.appConfig.upsert({
    where: { key: 'trial_days' },
    update: { value: String(n) },
    create: { key: 'trial_days', value: String(n) },
  })
  return NextResponse.json({ data: { days: n } })
}
