import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

const schema = z.object({
  period: z.string().min(1, 'period requerido'),
  subjectCodes: z.array(z.string()),
})

export async function PUT(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const body = await request.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const { period, subjectCodes } = result.data

  const profile = await prisma.studentProfile.findFirst({ where: { userId, isActive: true } })
  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado. Selecciona una carrera primero.' }, { status: 404 })

  if (subjectCodes.length === 0) {
    await prisma.preselection.deleteMany({ where: { profileId: profile.id, period } })
    return NextResponse.json({ data: { profileId: profile.id, period, subjects: [] } })
  }

  const preselection = await prisma.preselection.upsert({
    where: { profileId_period: { profileId: profile.id, period } },
    create: { profileId: profile.id, period, subjects: subjectCodes },
    update: { subjects: subjectCodes },
  })

  return NextResponse.json({ data: preselection })
}
