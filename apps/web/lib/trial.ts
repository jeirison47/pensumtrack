import { prisma } from '@/lib/db'

export const TRIAL_DAYS = 7

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
