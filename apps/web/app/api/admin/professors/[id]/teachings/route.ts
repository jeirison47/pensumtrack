import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'
import { resolveSubjectCode } from '@/lib/subjectLink'

const schema = z.object({
  universityId: z.string().min(1),
  subjectName: z.string().min(2),
  schedule: z.enum(['MORNING', 'AFTERNOON', 'NIGHT']).default('MORNING'),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()
  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const { id: professorId } = await params
  const body = await request.json()
  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })

  try {
    const subjectCode = await resolveSubjectCode(result.data.universityId, result.data.subjectName)
    const teaching = await prisma.professorTeaching.create({
      data: { professorId, ...result.data, subjectCode },
      include: { university: { select: { id: true, name: true, shortName: true } } },
    })
    return NextResponse.json({ data: teaching }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Esa materia ya está registrada para ese profesor en esa universidad' }, { status: 400 })
  }
}
