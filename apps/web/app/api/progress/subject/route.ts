import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

const schema = z.object({
  subjectCode: z.string().min(1, 'subjectCode requerido'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED']),
  grade: z.number().min(0).max(100).optional(),
  period: z.string().optional(),
  classDays: z.array(z.string()).optional(),
  classStart: z.string().nullable().optional(),
  classEnd: z.string().nullable().optional(),
  professorId: z.string().nullable().optional(),
  professorName: z.string().nullable().optional(),
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

  const profile = await prisma.studentProfile.findFirst({
    where: { userId },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
  })
  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado. Selecciona una carrera primero.' }, { status: 404 })

  const subject = await prisma.subject.findUnique({
    where: { code_careerId: { code: subjectCode, careerId: profile.careerId } },
  })
  if (!subject) return NextResponse.json({ error: 'Materia no encontrada' }, { status: 404 })

  // El horario solo aplica a materias en curso; al cambiar a otro estado se limpia.
  const sched = status === 'IN_PROGRESS'
    ? {
        classDays: result.data.classDays ?? [],
        classStart: result.data.classStart ?? null,
        classEnd: result.data.classEnd ?? null,
        professorId: result.data.professorId ?? null,
        professorName: result.data.professorName ?? null,
      }
    : { classDays: [], classStart: null, classEnd: null, professorId: null, professorName: null }

  const studentSubject = await prisma.studentSubject.upsert({
    where: { profileId_subjectCode: { profileId: profile.id, subjectCode } },
    create: { profileId: profile.id, subjectCode, status, grade, period, ...sched },
    update: { status, grade, period, ...sched },
  })

  return NextResponse.json({ data: studentSubject })
}
