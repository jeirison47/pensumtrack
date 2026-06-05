import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { sendPasswordChangedEmail } from '@/lib/email'
import { getClientIp } from '@/lib/turnstile'
import { rateLimit, tooManyRequests } from '@/lib/rateLimit'

const schema = z.object({
  email: z.string().email('Email inválido'),
  code: z.string().length(6, 'El código debe tener 6 dígitos'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

const MAX_ATTEMPTS = 5

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const email = result.data.email.toLowerCase().trim()
    const { code, password } = result.data

    // Rate limit por IP: máx. 10 intentos por 10 min
    const ip = getClientIp(request) ?? 'unknown'
    const rl = await rateLimit(`reset-password:${ip}`, 10, 10 * 60 * 1000)
    if (!rl.allowed) return tooManyRequests(rl.retryAfterSec)

    const reset = await prisma.passwordReset.findFirst({
      where: { email, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })
    if (!reset) {
      return NextResponse.json({ error: 'Código inválido o expirado. Solicita uno nuevo.' }, { status: 400 })
    }

    // Demasiados intentos sobre este código → invalidarlo
    if (reset.attempts >= MAX_ATTEMPTS) {
      await prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } })
      return NextResponse.json({ error: 'Demasiados intentos. Solicita un código nuevo.' }, { status: 429 })
    }

    // Código incorrecto → sumar intento
    if (reset.code !== code) {
      await prisma.passwordReset.update({ where: { id: reset.id }, data: { attempts: { increment: 1 } } })
      const left = MAX_ATTEMPTS - (reset.attempts + 1)
      return NextResponse.json(
        { error: left > 0 ? `Código incorrecto. Te quedan ${left} intentos.` : 'Código incorrecto.' },
        { status: 400 },
      )
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, displayName: true } })
    if (!user) return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })

    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      // Invalidar todos los códigos de reset de este correo
      prisma.passwordReset.updateMany({ where: { email, used: false }, data: { used: true } }),
    ])

    try { await sendPasswordChangedEmail(user.email, user.displayName) } catch { /* no crítico */ }

    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    console.error('[reset-password]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
