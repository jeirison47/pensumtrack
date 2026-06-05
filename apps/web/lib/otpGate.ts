// Lógica compartida del cooldown progresivo + tope de reenvíos de OTP.
// Espera creciente entre reenvíos: 1m, 5m, 15m, 30m, 1h.
const COOLDOWNS = [60, 300, 900, 1800, 3600]

export const MAX_OTP_SENDS = 4 // máx. correos de verificación por cuenta (inicial + 3 reenvíos)

interface Gate {
  capReached: boolean
  retryAfterSec: number // 0 si puede reenviar ya
}

// sendCount: cuántos OTP se han enviado hasta ahora. lastSentAt: fecha del último.
export function otpResendGate(sendCount: number, lastSentAt: Date): Gate {
  if (sendCount >= MAX_OTP_SENDS) return { capReached: true, retryAfterSec: 0 }
  const required = COOLDOWNS[Math.min(sendCount - 1, COOLDOWNS.length - 1)]
  const elapsed = Math.floor((Date.now() - lastSentAt.getTime()) / 1000)
  return { capReached: false, retryAfterSec: elapsed < required ? required - elapsed : 0 }
}

// Cooldown que aplicará para el PRÓXIMO reenvío (para el contador del front).
export function nextResendInSec(newSendCount: number): number | null {
  if (newSendCount >= MAX_OTP_SENDS) return null
  return COOLDOWNS[Math.min(newSendCount - 1, COOLDOWNS.length - 1)]
}
