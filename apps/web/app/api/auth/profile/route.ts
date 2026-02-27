import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

const schema = z.object({
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres').optional(),
}).refine(
  (d) => !(d.newPassword && !d.currentPassword),
  { message: 'Debes ingresar tu contraseña actual para cambiarla', path: ['currentPassword'] },
)

export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) return unauthorized()

    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { displayName, currentPassword, newPassword } = result.data

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const updateData: { displayName?: string; passwordHash?: string } = {}

    if (displayName) updateData.displayName = displayName

    if (newPassword && currentPassword) {
      if (!user.passwordHash) {
        return NextResponse.json({ error: 'Esta cuenta no tiene contraseña configurada' }, { status: 400 })
      }
      const valid = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!valid) {
        return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 })
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 10)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay cambios que aplicar' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, displayName: true, isAdmin: true, createdAt: true },
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[auth/profile]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
