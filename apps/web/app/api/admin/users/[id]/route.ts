import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const { id } = await params

  if (id === userId) return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    // Obtener perfiles del usuario para eliminar dependencias
    const profiles = await tx.studentProfile.findMany({ where: { userId: id }, select: { id: true } })
    const profileIds = profiles.map((p) => p.id)

    // Eliminar registros anidados de cada perfil
    if (profileIds.length > 0) {
      await tx.studentSubject.deleteMany({ where: { profileId: { in: profileIds } } })
      await tx.preselection.deleteMany({ where: { profileId: { in: profileIds } } })
    }
    await tx.studentProfile.deleteMany({ where: { userId: id } })

    // Eliminar solicitudes y actividad del usuario
    await tx.pensumRequest.deleteMany({ where: { userId: id } })
    await tx.professorRating.deleteMany({ where: { userId: id } })
    await tx.professorComment.deleteMany({ where: { userId: id } })
    await tx.professorRequest.deleteMany({ where: { userId: id } })
    await tx.professorUpdateRequest.deleteMany({ where: { userId: id } })
    await tx.emailVerification.deleteMany({ where: { userId: id } })

    await tx.user.delete({ where: { id } })
  })

  return NextResponse.json({ data: { id } })
}
