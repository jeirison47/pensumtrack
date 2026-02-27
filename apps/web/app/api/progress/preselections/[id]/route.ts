import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getUserId(request)
    if (!userId) return unauthorized()

    const { id } = await params

    const profile = await prisma.studentProfile.findFirst({ where: { userId, isActive: true } })
    if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

    const preselection = await prisma.preselection.findFirst({
      where: { id, profileId: profile.id },
    })
    if (!preselection) return NextResponse.json({ error: 'Período no encontrado' }, { status: 404 })

    // Si estaba CONFIRMED: revertir materias de IN_PROGRESS a PENDING
    if (preselection.status === 'CONFIRMED') {
      await prisma.studentSubject.updateMany({
        where: {
          profileId: profile.id,
          subjectCode: { in: preselection.subjects },
          status: 'IN_PROGRESS',
        },
        data: { status: 'PENDING' },
      })
    }

    await prisma.preselection.delete({ where: { id } })
    return NextResponse.json({ data: { id } })
  } catch (err) {
    console.error('[preselections DELETE]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
