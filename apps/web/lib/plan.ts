// Resuelve el plan efectivo de un usuario considerando la fecha de vencimiento.
// Un plan de pago vencido se trata como plan gratis (sin features) hasta que
// el cron diario lo baje formalmente al plan por defecto.

interface UserWithPlan {
  planExpiresAt: Date | null
  plan: { name: string; features: { featureKey: string }[] } | null
}

export interface EffectivePlan {
  planName: string | null
  planFeatures: string[]
  planExpiresAt: string | null
  planExpired: boolean
}

export function resolveEffectivePlan(user: UserWithPlan): EffectivePlan {
  const expired = !!user.planExpiresAt && user.planExpiresAt.getTime() < Date.now()

  if (expired || !user.plan) {
    return {
      planName: expired ? null : (user.plan?.name ?? null),
      planFeatures: expired ? [] : (user.plan?.features.map((f) => f.featureKey) ?? []),
      planExpiresAt: user.planExpiresAt?.toISOString() ?? null,
      planExpired: expired,
    }
  }

  return {
    planName: user.plan.name,
    planFeatures: user.plan.features.map((f) => f.featureKey),
    planExpiresAt: user.planExpiresAt?.toISOString() ?? null,
    planExpired: false,
  }
}
