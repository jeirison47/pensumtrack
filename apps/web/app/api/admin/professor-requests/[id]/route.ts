import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'
import { sendProfessorRequestStatusEmail } from '@/lib/email'

const schema = z.object({
  status: z.enum(['COMPLETED', 'REJECTED', 'IN_REVIEW']),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const { id } = await params
  const body = await request.json()
  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })

  const req = await prisma.professorRequest.findUnique({
    where: { id },
    include: { user: { select: { email: true, displayName: true } } },
  })
  if (!req) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })

  const updated = await prisma.professorRequest.update({
    where: { id },
    data: { status: result.data.status },
  })

  // Si se aprueba, crear el profesor automáticamente
  if (result.data.status === 'COMPLETED' && req.universityId) {
    const professor = await prisma.professor.create({
      data: {
        name: req.name,
        bio: req.bio,
        status: 'ACTIVE',
        teachings: {
          create: req.subjects.map((subjectName) => ({
            universityId: req.universityId!,
            subjectName,
            schedule: req.schedule,
          })),
        },
      },
    })
    await prisma.professorRequest.update({ where: { id }, data: { status: 'COMPLETED' } })
    await sendProfessorRequestStatusEmail(req.user.email, req.user.displayName, req.name, 'COMPLETED')
    return NextResponse.json({ data: { ...updated, professorId: professor.id } })
  }

  if (result.data.status === 'REJECTED') {
    await sendProfessorRequestStatusEmail(req.user.email, req.user.displayName, req.name, 'REJECTED')
  }

  return NextResponse.json({ data: updated })
}
