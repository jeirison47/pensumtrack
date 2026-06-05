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

    // Rate limit: por IP (5/10min) y por usuario (3/10min) — protege envío de correos
    const ip = getClientIp(request) ?? 'unknown'
    const rlIp = await rateLimit(`resend-otp:ip:${ip}`, 5, 10 * 60 * 1000)
    if (!rlIp.allowed) return tooManyRequests(rlIp.retryAfterSec)
    const rlUser = await rateLimit(`resend-otp:user:${userId}`, 3, 10 * 60 * 1000)
    if (!rlUser.allowed) return tooManyRequests(rlUser.retryAfterSec)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, displayName: true, isEmailVerified: true },
    })

    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    if (user.isEmailVerified) {
      return NextResponse.json({ error: 'El correo ya está verificado' }, { status: 400 })
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

    return NextResponse.json({ data: { sent: true } })
  } catch (err) {
    console.error('[resend-otp]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
