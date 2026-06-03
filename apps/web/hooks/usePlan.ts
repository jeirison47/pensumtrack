import { useAuthStore } from '@/store/useAuthStore'
import type { FeatureKey } from '@/lib/features'

export function usePlan() {
  const { user } = useAuthStore()
  const features: string[] = user?.planFeatures ?? []

  function hasFeature(key: FeatureKey): boolean {
    return features.includes(key)
  }

  return {
    planName: user?.planName ?? null,
    features,
    hasFeature,
  }
}
