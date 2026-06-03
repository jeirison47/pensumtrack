'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useThemeStore } from '@/store/useThemeStore'
import { useProgressStore } from '@/store/useProgressStore'
import { LayoutDashboard, BookOpen, GitBranch, CheckSquare, CircleUser, Moon, Sun, Shield, GraduationCap } from 'lucide-react'

const nav = [
  { href: '/dashboard',    label: 'Inicio',      icon: LayoutDashboard },
  { href: '/pensum',       label: 'Pensum',       icon: BookOpen },
  { href: '/preseleccion', label: 'Preselección', icon: CheckSquare },
  { href: '/profesores',   label: 'Profesores',   icon: GraduationCap },
  { href: '/mapa',         label: 'Mapa',         icon: GitBranch },
]

export function TopNav() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { theme, toggle } = useThemeStore()
  const { profile } = useProgressStore()
  const hasProfile = profile !== null

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 py-3 md:py-4"
            style={{ background: 'var(--surface)', borderBottom: '1px solid var(--pt-border)' }}>
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2">
        <img src="/logo.png" alt="PensumTrack" className="w-7 h-7 object-contain" />
        <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-syne)', color: 'var(--accent)' }}>
          PensumTrack
        </span>
      </Link>

      {/* Nav links — desktop only */}
      <nav className="hidden md:flex items-center gap-1">
        {!user?.isAdmin && hasProfile && nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
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

      {/* Right side: perfil + tema */}
      <div className="flex items-center gap-1">
        <Link href="/perfil"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                color: pathname === '/perfil' ? 'var(--accent)' : 'var(--muted)',
                background: pathname === '/perfil' ? 'rgba(16,185,129,0.08)' : 'transparent',
              }}>
          <CircleUser size={20} />
          <span className="hidden md:inline">Perfil</span>
        </Link>
        <button onClick={toggle}
                className="p-2 rounded-lg transition-colors hover:opacity-70 cursor-pointer"
                style={{ color: 'var(--muted)' }}
                title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  )
}
