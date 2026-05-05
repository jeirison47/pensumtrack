import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getUserId(request)
    if (!userId) return unauthorized()

    const { id } = await params

    const profile = await prisma.studentProfile.findFirst({ where: { userId } })
    if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

    const preselection = await prisma.preselection.findFirst({
      where: { id, profileId: profile.id },
    })
    if (!preselection) return NextResponse.json({ error: 'Período no encontrado' }, { status: 404 })

    if (preselection.subjects.length === 0) {
      return NextResponse.json({ error: 'Agrega al menos una materia antes de confirmar' }, { status: 400 })
    }

    const periodLabel = preselection.period ?? undefined

    const results = await prisma.$transaction([
      prisma.preselection.update({ where: { id }, data: {} }),
      ...preselection.subjects.map((code) =>
        prisma.studentSubject.upsert({
          where: { profileId_subjectCode: { profileId: profile.id, subjectCode: code } },
          create: { profileId: profile.id, subjectCode: code, status: 'IN_PROGRESS', period: periodLabel },
          update: { status: 'IN_PROGRESS', period: periodLabel },
        }),
      ),
    ])

    return NextResponse.json({ data: results[0] })
  } catch (err) {
    console.error('[preselections/confirm PUT]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
