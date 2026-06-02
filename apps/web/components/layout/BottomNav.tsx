'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, GitBranch, CheckSquare, Shield, GraduationCap } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'

const studentNav = [
  { href: '/dashboard',    label: 'Inicio',  icon: LayoutDashboard },
  { href: '/pensum',       label: 'Pensum',  icon: BookOpen },
  { href: '/preseleccion', label: 'Presel.', icon: CheckSquare },
  { href: '/profesores',   label: 'Profes.', icon: GraduationCap },
  { href: '/mapa',         label: 'Mapa',    icon: GitBranch },
]

const adminNav = [
  { href: '/admin', label: 'Admin', icon: Shield },
]

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  const nav = user?.isAdmin ? adminNav : studentNav

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden"
         style={{ background: 'var(--surface)', borderTop: '1px solid var(--pt-border)' }}>
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link key={href} href={href}
                className="flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors cursor-pointer"
                style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}>
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
