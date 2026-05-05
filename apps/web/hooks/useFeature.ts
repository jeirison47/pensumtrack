'use client'

import { useAuthStore } from '@/store/useAuthStore'

export function useFeature(featureKey: string): boolean {
  const user = useAuthStore((s) => s.user)
  if (!user) return false
  if (user.isAdmin) return true
  return user.planFeatures?.includes(featureKey) ?? false
}
