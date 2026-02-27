import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

const schema = z.object({
  careerId: z.string().min(1, 'careerId requerido'),
  currentSemester: z.number().int().min(1).max(20).default(1),
})

export async function POST(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const body = await request.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const { careerId, currentSemester } = result.data

  const career = await prisma.career.findUnique({ where: { id: careerId } })
  if (!career) return NextResponse.json({ error: 'Carrera no encontrada' }, { status: 404 })

  const profile = await prisma.studentProfile.upsert({
    where: { userId },
    create: { userId, careerId, currentSemester },
    update: { careerId, currentSemester },
    include: {
      career: { include: { subjects: { orderBy: [{ semester: 'asc' }, { code: 'asc' }] } } },
      subjects: true,
      preselections: { orderBy: { period: 'asc' } },
    },
  })

  return NextResponse.json({ data: profile })
}
