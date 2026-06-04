import { NextRequest } from 'next/server'

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export function getClientIp(req: NextRequest): string | undefined {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
}

// Verifica el token de Turnstile contra Cloudflare.
// Si TURNSTILE_SECRET_KEY no está configurado, no bloquea (útil en desarrollo).
export async function verifyTurnstile(
  token: string | undefined | null,
  ip?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // sin configurar: no bloquear
  if (!token) return false

  try {
    const form = new URLSearchParams()
    form.append('secret', secret)
    form.append('response', token)
    if (ip) form.append('remoteip', ip)

    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    return false
  }
}
