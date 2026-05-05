'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, GitBranch, Unlock, CheckSquare, CircleUser, Sun, Moon, Shield } from 'lucide-react'
import { useThemeStore } from '@/store/useThemeStore'
import { useAuthStore } from '@/store/useAuthStore'

const studentNav = [
  { href: '/dashboard',    label: 'Inicio',  icon: LayoutDashboard },
  { href: '/pensum',       label: 'Pensum',  icon: BookOpen },
  { href: '/preseleccion', label: 'Presel.', icon: CheckSquare },
  { href: '/mapa',         label: 'Mapa',    icon: GitBranch },
  { href: '/desbloqueo',   label: 'Unlock',  icon: Unlock },
  { href: '/perfil',       label: 'Perfil',  icon: CircleUser },
]

const adminNav = [
  { href: '/admin',  label: 'Admin',  icon: Shield },
  { href: '/perfil', label: 'Perfil', icon: CircleUser },
]

export function BottomNav() {
  const pathname = usePathname()
  const { theme, toggle } = useThemeStore()
  const { user } = useAuthStore()

  const nav = user?.isAdmin ? adminNav : studentNav

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden"
         style={{ background: 'var(--surface)', borderTop: '1px solid var(--pt-border)' }}>
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href === '/admin' && pathname.startsWith('/admin'))
        return (
          <Link key={href} href={href}
                className="flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors"
                style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}>
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        )
      })}
      <button onClick={toggle}
              className="flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors"
              style={{ color: 'var(--muted)' }}>
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        <span>Tema</span>
      </button>
    </nav>
  )
}
