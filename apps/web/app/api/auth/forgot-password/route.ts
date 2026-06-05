import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import { getClientIp } from '@/lib/turnstile'
import { rateLimit, tooManyRequests } from '@/lib/rateLimit'

const schema = z.object({ email: z.string().email('Email inválido') })

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const MAX_PER_DAY = 3 // máx. correos de restablecimiento por correo en 24 h

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const email = result.data.email.toLowerCase().trim()

    // Rate limit por IP: máx. 5 solicitudes por hora
    const ip = getClientIp(request) ?? 'unknown'
    const rl = await rateLimit(`forgot-password:${ip}`, 5, 60 * 60 * 1000)
    if (!rl.allowed) return tooManyRequests(rl.retryAfterSec)

    // Respuesta genérica SIEMPRE (no revelar si el correo existe)
    const genericOk = NextResponse.json({ data: { sent: true } })

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, displayName: true } })
    if (!user) return genericOk

    // Tope de 3 por correo en 24 h (silencioso para no filtrar info)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const sentToday = await prisma.passwordReset.count({ where: { email, createdAt: { gte: since } } })
    if (sentToday >= MAX_PER_DAY) return genericOk

    // Invalidar códigos anteriores y crear uno nuevo
    await prisma.passwordReset.updateMany({ where: { email, used: false }, data: { used: true } })
    const code = generateOtp()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    await prisma.passwordReset.create({ data: { email, code, expiresAt } })

    await sendPasswordResetEmail(email, user.displayName, code)

    return genericOk
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
