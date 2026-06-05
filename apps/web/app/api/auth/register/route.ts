import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { sendOtpEmail } from '@/lib/email'
import { verifyTurnstile, getClientIp } from '@/lib/turnstile'
import { rateLimit, tooManyRequests } from '@/lib/rateLimit'

const schema = z.object({
  email: z.string().email('Email inválido'),
  username: z
    .string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(20, 'El usuario no puede tener más de 20 caracteres')
    .regex(/^[a-z0-9_]+$/, 'El usuario solo puede contener letras minúsculas, números y guiones bajos'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
})

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Rate limit por IP: máx. 5 registros por hora
    const ip = getClientIp(request) ?? 'unknown'
    const rl = await rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)
    if (!rl.allowed) return tooManyRequests(rl.retryAfterSec)

    // Verificación anti-bot (Turnstile) antes de crear nada o enviar correo
    const captchaOk = await verifyTurnstile(body?.turnstileToken, ip)
    if (!captchaOk) {
      return NextResponse.json(
        { error: 'Verificación de seguridad fallida. Recarga la página e inténtalo de nuevo.' },
        { status: 400 },
      )
    }

    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { email, username, password, displayName } = result.data

    // El email/usuario no debe estar tomado por una cuenta ya creada (real)
    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { username } }),
    ])
    if (existingEmail) return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 400 })
    if (existingUsername) return NextResponse.json({ error: 'Ese nombre de usuario ya está en uso' }, { status: 400 })

    // Ni por OTRO registro pendiente (mismo username con distinto email)
    const usernameClash = await prisma.pendingRegistration.findFirst({
      where: { username, NOT: { email } },
      select: { id: true },
    })
    if (usernameClash) return NextResponse.json({ error: 'Ese nombre de usuario ya está en uso' }, { status: 400 })

    const passwordHash = await bcrypt.hash(password, 10)
    const code = generateOtp()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    // NO se crea el User todavía: se guarda como registro pendiente hasta verificar.
    // Si ya existía un pendiente con ese email, se reemplaza (reinicia contador).
    const pending = await prisma.pendingRegistration.upsert({
      where: { email },
      create: { email, username, passwordHash, displayName, code, expiresAt, sendCount: 1, lastSentAt: new Date() },
      update: { username, passwordHash, displayName, code, expiresAt, sendCount: 1, lastSentAt: new Date() },
    })

    await sendOtpEmail(email, displayName, code)

    return NextResponse.json(
      { data: { requiresVerification: true, pendingId: pending.id, email } },
      { status: 201 },
    )
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
