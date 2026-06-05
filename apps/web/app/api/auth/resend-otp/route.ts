import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { sendOtpEmail } from '@/lib/email'
import { getClientIp } from '@/lib/turnstile'
import { rateLimit, tooManyRequests } from '@/lib/rateLimit'

const schema = z.object({
  userId: z.string().min(1),
})

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { userId } = result.data

    // Rate limit por IP (5/10min) — protege envío de correos ante abuso distribuido
    const ip = getClientIp(request) ?? 'unknown'
    const rlIp = await rateLimit(`resend-otp:ip:${ip}`, 5, 10 * 60 * 1000)
    if (!rlIp.allowed) return tooManyRequests(rlIp.retryAfterSec)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, displayName: true, isEmailVerified: true },
    })

    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    if (user.isEmailVerified) {
      return NextResponse.json({ error: 'El correo ya está verificado' }, { status: 400 })
    }

    // ─── Cooldown progresivo + tope por cuenta (basado en OTPs ya enviados) ───
    // Espera creciente entre reenvíos: 1m, 5m, 15m, 30m, 1h.
    const COOLDOWNS = [60, 300, 900, 1800, 3600]
    const MAX_24H = 4 // máx. correos de verificación por cuenta en 24 h (inicial + 3 reenvíos)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recent = await prisma.emailVerification.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })
    const sent = recent.length

    if (sent >= MAX_24H) {
      return NextResponse.json(
        { error: 'Alcanzaste el límite de códigos por hoy. Espera 24 horas o contáctanos para ayudarte.' },
        { status: 429 },
      )
    }
    if (sent >= 1) {
      const required = COOLDOWNS[Math.min(sent - 1, COOLDOWNS.length - 1)]
      const elapsed = Math.floor((Date.now() - recent[0].createdAt.getTime()) / 1000)
      if (elapsed < required) {
        const retry = required - elapsed
        const mins = Math.ceil(retry / 60)
        return NextResponse.json(
          { error: `Espera ${retry < 60 ? `${retry}s` : `${mins} min`} antes de pedir otro código.`, retryAfterSec: retry },
          { status: 429, headers: { 'Retry-After': String(retry) } },
        )
      }
    }

    // Invalidar OTPs anteriores
    await prisma.emailVerification.updateMany({
      where: { userId, used: false },
      data: { used: true },
    })

    const code = generateOtp()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.emailVerification.create({
      data: { userId, code, expiresAt },
    })

    await sendOtpEmail(user.email, user.displayName, code)

    // Cooldown que aplicará para el PRÓXIMO reenvío (para el contador del front)
    const nextSent = sent + 1
    const nextResendInSec = nextSent >= MAX_24H ? null : COOLDOWNS[Math.min(nextSent - 1, COOLDOWNS.length - 1)]

    return NextResponse.json({ data: { sent: true, nextResendInSec } })
  } catch (err) {
    console.error('[resend-otp]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
