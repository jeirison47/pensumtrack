'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && !user?.isAdmin) router.replace('/dashboard')
  }, [user, isAuthenticated, router])

  if (!user?.isAdmin) return null

  return <>{children}</>
}
