'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Shield, ShieldOff, UserCheck, UserX, Users, BookOpen, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminApi, type AdminStats } from '@/services/api'
import toast from 'react-hot-toast'

type AdminUser = {
  id: string
  email: string
  displayName: string
  isAdmin: boolean
  isActive: boolean
  createdAt: string
}

export default function AdminUsuariosPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.stats().then(r => setStats(r.data)).catch(() => {})
  }, [])

  const fetchUsers = useCallback(async (query: string, pg: number) => {
    setLoading(true)
    try {
      const r = await adminApi.users(query, pg)
      setUsers(r.data.users as AdminUser[])
      setTotal(r.data.total)
      setPage(r.data.page)
      setPages(r.data.pages)
    } catch {
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers(search, 1)
  }, [search, fetchUsers])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(q)
  }

  async function handleToggleAdmin(user: AdminUser) {
    try {
      await adminApi.toggleAdmin(user.id, !user.isAdmin)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isAdmin: !u.isAdmin } : u))
    } catch (err: any) {
      toast.error(err.message || 'Error')
    }
  }

  async function handleToggleActive(user: AdminUser) {
    try {
      await adminApi.toggleActive(user.id, !user.isActive)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u))
    } catch (err: any) {
      toast.error(err.message || 'Error')
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
        Panel de administración
      </h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Usuarios', value: stats.totalUsers, icon: Users },
            { label: 'Universidades', value: stats.totalUniversities, icon: GraduationCap },
            { label: 'Carreras', value: stats.totalCareers, icon: BookOpen },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl p-4 space-y-1"
              style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
              <Icon size={18} style={{ color: 'var(--accent)' }} />
              <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{value}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
          <Search size={15} style={{ color: 'var(--muted)' }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre o email…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text)' }}
          />
        </div>
        <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--accent)', color: '#0b0d12' }}>
          Buscar
        </button>
      </form>

      {/* Users table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
        <div className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--pt-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Usuarios <span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>({total})</span>
          </p>
        </div>

        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--pt-border)', borderTopColor: 'var(--accent)' }} />
          </div>
        ) : users.length === 0 ? (
          <p className="py-10 text-center text-sm" style={{ color: 'var(--muted)' }}>Sin resultados</p>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--pt-border)' }}>
            {users.map(user => (
              <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'var(--surface2)', color: 'var(--accent)' }}>
                  {user.displayName[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{user.displayName}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{user.email}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {user.isAdmin && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--accent)' }}>
                      Admin
                    </span>
                  )}
                  {!user.isActive && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(248,113,113,0.12)', color: 'var(--danger)' }}>
                      Inactivo
                    </span>
                  )}
                  <button onClick={() => handleToggleAdmin(user)}
                    title={user.isAdmin ? 'Quitar admin' : 'Hacer admin'}
                    className="p-1.5 rounded-lg transition hover:opacity-70"
                    style={{ color: user.isAdmin ? 'var(--accent)' : 'var(--muted)' }}>
                    {user.isAdmin ? <Shield size={15} /> : <ShieldOff size={15} />}
                  </button>
                  <button onClick={() => handleToggleActive(user)}
                    title={user.isActive ? 'Desactivar' : 'Activar'}
                    className="p-1.5 rounded-lg transition hover:opacity-70"
                    style={{ color: user.isActive ? 'var(--muted)' : 'var(--danger)' }}>
                    {user.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => fetchUsers(search, page - 1)} disabled={page <= 1}
            className="p-2 rounded-lg transition hover:opacity-70 disabled:opacity-30"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--pt-border)' }}>
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm" style={{ color: 'var(--muted)' }}>
            Página {page} de {pages}
          </span>
          <button onClick={() => fetchUsers(search, page + 1)} disabled={page >= pages}
            className="p-2 rounded-lg transition hover:opacity-70 disabled:opacity-30"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--pt-border)' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
