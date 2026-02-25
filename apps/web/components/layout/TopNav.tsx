'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
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
  const { user, logout } = useAuthStore()

  return (
    <header className="hidden md:flex items-center justify-between px-8 py-4 sticky top-0 z-50"
            style={{ background: 'var(--surface)', borderBottom: '1px solid var(--pt-border)' }}>
      <Link href="/dashboard" className="font-bold text-lg" style={{ fontFamily: 'var(--font-syne)', color: 'var(--accent)' }}>
        PensumTrack
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
        <span className="text-sm" style={{ color: 'var(--muted)' }}>{user?.displayName}</span>
        <button onClick={logout} className="p-2 rounded-lg transition-colors hover:opacity-80"
                style={{ color: 'var(--muted)' }}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
