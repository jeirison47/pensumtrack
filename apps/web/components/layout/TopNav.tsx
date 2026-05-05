'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useThemeStore } from '@/store/useThemeStore'
import { LayoutDashboard, BookOpen, GitBranch, Unlock, CheckSquare, CircleUser, Moon, Sun, Shield } from 'lucide-react'

const nav = [
  { href: '/dashboard',    label: 'Inicio',      icon: LayoutDashboard },
  { href: '/pensum',       label: 'Pensum',       icon: BookOpen },
  { href: '/preseleccion', label: 'Preselección', icon: CheckSquare },
  { href: '/mapa',         label: 'Mapa',         icon: GitBranch },
  { href: '/desbloqueo',   label: 'Desbloqueo',   icon: Unlock },
]

export function TopNav() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { theme, toggle } = useThemeStore()

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
        {!user?.isAdmin && nav.map(({ href, label, icon: Icon }) => {
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
        {user?.isAdmin && (
          <Link href="/admin"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
                style={{
                  color: pathname.startsWith('/admin') ? 'var(--accent)' : 'var(--muted)',
                  background: pathname.startsWith('/admin') ? 'rgba(16,185,129,0.08)' : 'transparent',
                }}>
            <Shield size={16} />
            Panel Admin
          </Link>
        )}
      </nav>

      <div className="flex items-center gap-2">
        <Link href="/perfil"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
              style={{
                color: pathname === '/perfil' ? 'var(--accent)' : 'var(--muted)',
                background: pathname === '/perfil' ? 'rgba(16,185,129,0.08)' : 'transparent',
              }}>
          <CircleUser size={16} />
          Perfil
        </Link>
        <button onClick={toggle}
                className="p-2 rounded-lg transition-colors hover:opacity-70"
                style={{ color: 'var(--muted)' }}
                title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  )
}
