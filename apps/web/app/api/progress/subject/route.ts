import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

const schema = z.object({
  subjectCode: z.string().min(1, 'subjectCode requerido'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED']),
  grade: z.number().min(0).max(100).optional(),
  period: z.string().optional(),
})

export async function PUT(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const body = await request.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const { subjectCode, status, grade, period } = result.data

  const profile = await prisma.studentProfile.findFirst({ where: { userId, isActive: true } })
  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado. Selecciona una carrera primero.' }, { status: 404 })

  const subject = await prisma.subject.findUnique({ where: { code: subjectCode } })
  if (!subject) return NextResponse.json({ error: 'Materia no encontrada' }, { status: 404 })

  const studentSubject = await prisma.studentSubject.upsert({
    where: { profileId_subjectCode: { profileId: profile.id, subjectCode } },
    create: { profileId: profile.id, subjectCode, status, grade, period },
    update: { status, grade, period },
  })

  return NextResponse.json({ data: studentSubject })
}
