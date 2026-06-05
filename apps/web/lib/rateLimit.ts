import { prisma } from '@/lib/db'

interface RateLimitResult {
  allowed: boolean
  retryAfterSec?: number
}

// Rate limiting por ventana fija usando la base de datos (Neon).
// key: identificador único de la acción + sujeto, ej. "register:1.2.3.4".
// limit: máximo de solicitudes permitidas dentro de la ventana.
// windowMs: duración de la ventana en milisegundos.
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = new Date()

  try {
    const existing = await prisma.rateLimit.findUnique({ where: { key } })

    // Sin registro o ventana expirada → abrir nueva ventana
    if (!existing || existing.resetAt <= now) {
      const resetAt = new Date(now.getTime() + windowMs)
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      })
      return { allowed: true }
    }

    // Dentro de la ventana y ya alcanzó el límite → bloquear
    if (existing.count >= limit) {
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000)),
      }
    }

    // Dentro de la ventana, aún hay margen → incrementar
    await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } })
    return { allowed: true }
  } catch (err) {
    // Si el rate limiter falla (BD caída, etc.) no bloqueamos al usuario legítimo.
    console.error('[rateLimit] error:', err)
    return { allowed: true }
  }
}

// Respuesta estándar 429 cuando se supera el límite.
export function tooManyRequests(retryAfterSec?: number) {
  return Response.json(
    { error: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.' },
    { status: 429, headers: retryAfterSec ? { 'Retry-After': String(retryAfterSec) } : undefined },
  )
}
