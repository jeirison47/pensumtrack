import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

const schema = z.object({
  details: z.string().min(10, 'Describe el cambio con más detalle').max(1000),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  try {
    const { id: professorId } = await params
    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })

    const professor = await prisma.professor.findUnique({ where: { id: professorId, status: 'ACTIVE' } })
    if (!professor) return NextResponse.json({ error: 'Profesor no encontrado' }, { status: 404 })

    const req = await prisma.professorUpdateRequest.create({
      data: { userId, professorId, details: result.data.details },
    })

    return NextResponse.json({ data: req }, { status: 201 })
  } catch (err) {
    console.error('[professors/update-request]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
