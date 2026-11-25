import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { sendOtpEmail } from '@/lib/email'
import { resolveEffectivePlan } from '@/lib/plan'
import { isTrialAvailable } from '@/lib/trial'
import { getClientIp } from '@/lib/turnstile'
import { rateLimit, tooManyRequests } from '@/lib/rateLimit'
import { EMAIL_VERIFICATION_ENABLED } from '@/lib/emailVerification'
import { authUserInclude } from '@/lib/authSession'

const schema = z.object({
  identifier: z.string().min(1, 'Email o usuario requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
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

    const { identifier, password } = result.data

    // Rate limit por IP: máx. 10 intentos por 5 min (anti fuerza bruta)
    const ip = getClientIp(request) ?? 'unknown'
    const rl = await rateLimit(`login:${ip}`, 10, 5 * 60 * 1000)
    if (!rl.allowed) return tooManyRequests(rl.retryAfterSec)

    const byIdentifier = identifier.includes('@') ? { email: identifier } : { username: identifier }

    let user = await prisma.user.findFirst({
      where: byIdentifier,
      include: authUserInclude,
    })

    // Verificación APAGADA (ver lib/emailVerification.ts): quien se registró pero
    // se quedó esperando un código que nunca llegó (registro pendiente) puede
    // entrar con su contraseña; su cuenta se crea en este momento.
    if (!user && !EMAIL_VERIFICATION_ENABLED) {
      const pending = await prisma.pendingRegistration.findFirst({ where: byIdentifier })
      if (pending && (await bcrypt.compare(password, pending.passwordHash))) {
        const [emailTaken, usernameTaken] = await Promise.all([
          prisma.user.findUnique({ where: { email: pending.email }, select: { id: true } }),
          prisma.user.findUnique({ where: { username: pending.username }, select: { id: true } }),
        ])
        if (!emailTaken && !usernameTaken) {
          const defaultPlan = await prisma.plan.findFirst({ where: { isDefault: true }, select: { id: true } })
          user = await prisma.user.create({
            data: {
              email: pending.email,
              username: pending.username,
              passwordHash: pending.passwordHash,
              displayName: pending.displayName,
              isEmailVerified: false,
              ...(defaultPlan ? { planId: defaultPlan.id } : {}),
            },
            include: authUserInclude,
          })
          await prisma.pendingRegistration.delete({ where: { id: pending.id } }).catch(() => {})
        }
      }
    }

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })

    if (!user.isActive) {
      return NextResponse.json({ error: 'Cuenta desactivada' }, { status: 403 })
    }

    // Si el email no está verificado, enviar nuevo OTP y pedir verificación.
    // Con la verificación APAGADA (lib/emailVerification.ts) se deja entrar igual.
    if (!user.isEmailVerified && EMAIL_VERIFICATION_ENABLED) {
      await prisma.emailVerification.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      })

      const code = generateOtp()
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

      await prisma.emailVerification.create({
        data: { userId: user.id, code, expiresAt },
      })

      await sendOtpEmail(user.email, user.displayName, code)

      return NextResponse.json(
        { data: { requiresVerification: true, userId: user.id, email: user.email } },
        { status: 403 },
      )
    }

    const effectivePlan = resolveEffectivePlan(user)

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET ?? '', { expiresIn: '7d' })
    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
          planName: effectivePlan.planName,
          planFeatures: effectivePlan.planFeatures,
          planExpiresAt: effectivePlan.planExpiresAt,
          planExpired: effectivePlan.planExpired,
          trialAvailable: isTrialAvailable(user),
          settings: user.profiles[0] ?? null,
        },
        token,
      },
    })
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
