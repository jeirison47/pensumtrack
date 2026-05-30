import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'
import { sendPasswordChangedEmail } from '@/lib/email'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const { id } = await params
  const { newPassword } = await request.json()

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  const updated = await prisma.user.update({
    where: { id },
    data: { passwordHash },
    select: { email: true, displayName: true },
  })

  await sendPasswordChangedEmail(updated.email, updated.displayName)

  return NextResponse.json({ data: { message: 'Contraseña actualizada' } })
}
