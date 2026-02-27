'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { useProgressStore } from '@/store/useProgressStore'
import { LayoutDashboard, BookOpen, GitBranch, Unlock, CheckSquare, LogOut } from 'lucide-react'

const nav = [
  { href: '/dashboard',    label: 'Inicio',      icon: LayoutDashboard },
  { href: '/pensum',       label: 'Pensum',       icon: BookOpen },
  { href: '/preseleccion', label: 'Preselección', icon: CheckSquare },
  { href: '/mapa',         label: 'Mapa',         icon: GitBranch },
  { href: '/desbloqueo',   label: 'Desbloqueo',   icon: Unlock },
]

export function TopNav() {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const { user, logout } = useAuthStore()
  const { setProfile } = useProgressStore()

  const handleLogout = () => {
    queryClient.clear()
    setProfile(null)
    logout()
  }

  return (
    <header className="hidden md:flex items-center justify-between px-8 py-4 sticky top-0 z-50"
            style={{ background: 'var(--surface)', borderBottom: '1px solid var(--pt-border)' }}>
      <Link href="/dashboard" className="flex items-center gap-2">
        <img src="/logo.png" alt="PensumTrack" className="w-7 h-7 object-contain" />
        <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-syne)', color: 'var(--accent)' }}>
          PensumTrack
        </span>
      </Link>

      <nav className="flex items-center gap-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    color: active ? 'var(--accent)' : 'var(--muted)',
                    background: active ? 'rgba(110,231,183,0.08)' : 'transparent',
                  }}>
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-3">
        <Link href="/perfil"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors hover:opacity-80"
              style={{
                color: pathname === '/perfil' ? 'var(--accent)' : 'var(--muted)',
                background: pathname === '/perfil' ? 'rgba(110,231,183,0.08)' : 'transparent',
              }}>
          {user?.displayName}
        </Link>
        <button onClick={handleLogout} className="p-2 rounded-lg transition-colors hover:opacity-80"
                style={{ color: 'var(--muted)' }}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
