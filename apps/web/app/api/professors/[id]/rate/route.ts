import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

const schema = z.object({
  teachingId: z.string().min(1),
  puntualidad: z.number().int().min(1).max(10),
  explicacion: z.number().int().min(1).max(10),
  dominio: z.number().int().min(1).max(10),
  exigencia: z.number().int().min(1).max(10),
  personalidad: z.number().int().min(1).max(10),
  apoyo: z.number().int().min(1).max(10),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  try {
    const { id: professorId } = await params
    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })

    const { teachingId, ...scores } = result.data

    const teaching = await prisma.professorTeaching.findFirst({
      where: { id: teachingId, professorId },
    })
    if (!teaching) return NextResponse.json({ error: 'Materia no encontrada' }, { status: 404 })

    const rating = await prisma.professorRating.upsert({
      where: { userId_teachingId: { userId, teachingId } },
      create: { userId, professorId, teachingId, ...scores },
      update: { ...scores },
    })

    return NextResponse.json({ data: rating })
  } catch (err) {
    console.error('[professors/rate]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
