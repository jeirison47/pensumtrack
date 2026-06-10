import { prisma } from '@/lib/db'

export const DEFAULT_TRIAL_DAYS = 30

// Duración de la prueba en días, configurable desde el admin (AppConfig).
export async function getTrialDays(): Promise<number> {
  const config = await prisma.appConfig.findUnique({ where: { key: 'trial_days' } })
  const n = config ? parseInt(config.value) : NaN
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TRIAL_DAYS
}

// El plan que otorga la prueba gratis: el primer plan de pago (no default).
export function getTrialPlan() {
  return prisma.plan.findFirst({
    where: { isDefault: false },
    orderBy: { price: 'asc' },
    select: { id: true, name: true },
  })
}

// ¿El usuario puede iniciar la prueba gratis?
// No la ha usado nunca y está en el plan gratis (o su plan de pago ya venció).
export function isTrialAvailable(user: {
  trialUsedAt: Date | null
  planExpiresAt: Date | null
  plan: { isDefault: boolean } | null
}): boolean {
  if (user.trialUsedAt) return false
  const expired = !!user.planExpiresAt && user.planExpiresAt.getTime() < Date.now()
  return !user.plan || user.plan.isDefault || expired
}
