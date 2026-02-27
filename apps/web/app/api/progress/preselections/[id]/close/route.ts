import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

const schema = z.object({
  results: z.array(z.object({
    subjectCode: z.string(),
    status: z.enum(['PASSED', 'FAILED']),
    grade: z.number().optional(),
  })),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getUserId(request)
    if (!userId) return unauthorized()

    const { id } = await params

    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { results } = result.data

    const profile = await prisma.studentProfile.findFirst({ where: { userId, isActive: true } })
    if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

    const preselection = await prisma.preselection.findFirst({
      where: { id, profileId: profile.id },
    })
    if (!preselection) return NextResponse.json({ error: 'Período no encontrado' }, { status: 404 })

    if (preselection.status !== 'CONFIRMED') {
      return NextResponse.json({ error: 'Solo puedes cerrar períodos confirmados' }, { status: 409 })
    }

    const txResults = await prisma.$transaction([
      prisma.preselection.update({
        where: { id },
        data: { status: 'CLOSED' },
      }),
      ...results.map(({ subjectCode, status, grade }) =>
        prisma.studentSubject.upsert({
          where: { profileId_subjectCode: { profileId: profile.id, subjectCode } },
          create: { profileId: profile.id, subjectCode, careerId: profile.careerId, status, grade: grade ?? null, period: preselection.label },
          update: { status, grade: grade ?? null },
        }),
      ),
    ])

    return NextResponse.json({ data: txResults[0] })
  } catch (err) {
    console.error('[preselections/close PUT]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
