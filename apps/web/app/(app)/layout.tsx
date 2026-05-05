'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { TopNav } from '@/components/layout/TopNav'
import { BottomNav } from '@/components/layout/BottomNav'
import { Toaster } from 'react-hot-toast'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login')
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100dvh' }}>
      <TopNav />
      <main className="pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--pt-border)' },
        }}
      />
    </div>
  )
}
