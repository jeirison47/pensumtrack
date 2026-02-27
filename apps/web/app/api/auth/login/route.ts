import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const { email, password } = result.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
  }

  if (!user.isActive) {
    return NextResponse.json({ error: 'Cuenta desactivada' }, { status: 403 })
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET ?? '', { expiresIn: '7d' })
  return NextResponse.json({
    data: {
      user: { id: user.id, email: user.email, displayName: user.displayName, isAdmin: user.isAdmin, createdAt: user.createdAt },
      token,
    },
  })
}
