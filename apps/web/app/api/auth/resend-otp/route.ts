import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { sendOtpEmail } from '@/lib/email'
import { getClientIp } from '@/lib/turnstile'
import { rateLimit, tooManyRequests } from '@/lib/rateLimit'
import { otpResendGate, nextResendInSec } from '@/lib/otpGate'

const schema = z.object({
  pendingId: z.string().optional(),
  userId: z.string().optional(),
})

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const CAP_MSG = 'Alcanzaste el límite de códigos por hoy. Espera 24 horas o contáctanos para ayudarte.'

function cooldownResponse(retry: number) {
  const mins = Math.ceil(retry / 60)
  return NextResponse.json(
    { error: `Espera ${retry < 60 ? `${retry}s` : `${mins} min`} antes de pedir otro código.`, retryAfterSec: retry },
    { status: 429, headers: { 'Retry-After': String(retry) } },
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { pendingId, userId } = result.data

    // Rate limit por IP (5/10min) — protege envío de correos ante abuso distribuido
    const ip = getClientIp(request) ?? 'unknown'
    const rlIp = await rateLimit(`resend-otp:ip:${ip}`, 5, 10 * 60 * 1000)
    if (!rlIp.allowed) return tooManyRequests(rlIp.retryAfterSec)

    const code = generateOtp()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    // ─── Flujo nuevo: registro pendiente ───────────────────────────────────────
    if (pendingId) {
      const pending = await prisma.pendingRegistration.findUnique({ where: { id: pendingId } })
      if (!pending) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })

      const gate = otpResendGate(pending.sendCount, pending.lastSentAt)
      if (gate.capReached) return NextResponse.json({ error: CAP_MSG }, { status: 429 })
      if (gate.retryAfterSec > 0) return cooldownResponse(gate.retryAfterSec)

      await prisma.pendingRegistration.update({
        where: { id: pending.id },
        data: { code, expiresAt, sendCount: { increment: 1 }, lastSentAt: new Date() },
      })
      await sendOtpEmail(pending.email, pending.displayName, code)

      return NextResponse.json({ data: { sent: true, nextResendInSec: nextResendInSec(pending.sendCount + 1) } })
    }

    // ─── Flujo legacy: usuario ya creado sin verificar (cuentas previas) ────────
    if (!userId) return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, displayName: true, isEmailVerified: true },
    })
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    if (user.isEmailVerified) {
      return NextResponse.json({ error: 'El correo ya está verificado' }, { status: 400 })
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recent = await prisma.emailVerification.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })
    const sent = recent.length

    if (sent >= 1) {
      const gate = otpResendGate(sent, recent[0].createdAt)
      if (gate.capReached) return NextResponse.json({ error: CAP_MSG }, { status: 429 })
      if (gate.retryAfterSec > 0) return cooldownResponse(gate.retryAfterSec)
    }

    await prisma.emailVerification.updateMany({ where: { userId, used: false }, data: { used: true } })
    await prisma.emailVerification.create({ data: { userId, code, expiresAt } })
    await sendOtpEmail(user.email, user.displayName, code)

    return NextResponse.json({ data: { sent: true, nextResendInSec: nextResendInSec(sent + 1) } })
  } catch (err) {
    console.error('[resend-otp]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
