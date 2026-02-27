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

    // Verificar que el perfil pertenece al usuario
    const target = await prisma.studentProfile.findUnique({ where: { id } })
    if (!target || target.userId !== userId) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    }

    // Transacción: desactivar todos, activar el seleccionado
    await prisma.$transaction([
      prisma.studentProfile.updateMany({
        where: { userId },
        data: { isActive: false },
      }),
      prisma.studentProfile.update({
        where: { id },
        data: { isActive: true },
      }),
    ])

    return NextResponse.json({ data: { id, isActive: true } })
  } catch (err) {
    console.error('[profiles/active]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
