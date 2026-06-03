'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Shield, ShieldOff, UserCheck, UserX, Users, BookOpen, GraduationCap,
  ChevronLeft, ChevronRight, Plus, Trash2, CreditCard, Tag, KeyRound,
  Upload, Eye, EyeOff, CheckCircle, AlertTriangle, ToggleLeft, ToggleRight, Copy, Check, MailCheck,
} from 'lucide-react'
import { adminApi, pensumApi, pensumRequestsApi, type AdminStats, type Plan, type ParsedPensum, type CareerVersion, type PensumRequest, type PensumRequestStatus, type UniversityAdmin, type CareerAdmin } from '@/services/api'
import { PENSUM_TEMPLATE, PERIOD_LABELS } from '@/lib/parsePensum'
import { FEATURE_KEYS, FEATURE_LABELS } from '@/lib/features'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import toast from 'react-hot-toast'

type AdminUser = {
  id: string
  email: string
  username: string | null
  displayName: string
  isAdmin: boolean
  isActive: boolean
  isEmailVerified: boolean
  createdAt: string
  plan?: { id: string; name: string } | null
}

type Tab = 'usuarios' | 'planes' | 'solicitudes' | 'pensums' | 'carreras' | 'universidades' | 'profesores' | 'pagos'

const TAB_LABELS: Record<Tab, string> = {
  usuarios: 'Usuarios', planes: 'Planes', solicitudes: 'Solicitudes',
  pensums: 'Pensums', carreras: 'Carreras', universidades: 'Universidades', profesores: 'Profesores', pagos: 'Pagos',
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('usuarios')

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
        Panel de administración
      </h1>

      <div className="flex gap-1 p-1 rounded-xl flex-wrap" style={{ background: 'var(--surface2)' }}>
        {(['usuarios', 'planes', 'solicitudes', 'pensums', 'carreras', 'universidades', 'profesores', 'pagos'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: tab === t ? 'var(--surface)' : 'transparent',
              color: tab === t ? 'var(--text)' : 'var(--muted)',
            }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'usuarios' && <UsersTab />}
      {tab === 'planes' && <PlansTab />}
      {tab === 'pensums' && <PensumsTab />}
      {tab === 'solicitudes' && <RequestsTab />}
      {tab === 'universidades' && <UniversidadesTab />}
      {tab === 'carreras' && <CarrerasTab />}
      {tab === 'profesores' && <ProfesoresAdminTab />}
      {tab === 'pagos' && <PagosAdminTab />}
    </div>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [bulkActing, setBulkActing] = useState(false)
  const [bulkPlanId, setBulkPlanId] = useState('')
  const selectAllRef = useRef<HTMLInputElement>(null)

  const allSelected = users.length > 0 && selected.size === users.length
  const someSelected = selected.size > 0

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected
    }
  }, [someSelected, allSelected])

  useEffect(() => {
    adminApi.stats().then((r) => setStats(r.data)).catch(() => {})
    adminApi.listPlans().then((r) => setPlans(r.data)).catch(() => {})
  }, [])

  const fetchUsers = useCallback(async (query: string, pg: number) => {
    setLoading(true)
    setSelected(new Set())
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

  useEffect(() => { fetchUsers(search, 1) }, [search, fetchUsers])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(q)
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(users.map((u) => u.id)))
  }

  async function handleBulkAction(action: 'activate' | 'deactivate' | 'assign_plan' | 'delete', planId?: string | null) {
    setBulkActing(true)
    try {
      const ids = Array.from(selected)
      const r = await adminApi.bulkAction(ids, action, planId)
      toast.success(`${r.data.affected} usuario(s) actualizados`)
      setSelected(new Set())
      setBulkDeleteConfirm(false)
      fetchUsers(search, page)
    } catch (err: any) {
      toast.error(err.message || 'Error')
    } finally {
      setBulkActing(false)
    }
  }

  async function handleToggleAdmin(user: AdminUser) {
    try {
      await adminApi.toggleAdmin(user.id, !user.isAdmin)
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isAdmin: !u.isAdmin } : u))
    } catch (err: any) {
      toast.error(err.message || 'Error')
    }
  }

  async function handleToggleActive(user: AdminUser) {
    try {
      await adminApi.toggleActive(user.id, !user.isActive)
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u))
    } catch (err: any) {
      toast.error(err.message || 'Error')
    }
  }

  async function handleDeleteUser() {
    if (!deleteTarget) return
    try {
      await adminApi.deleteUser(deleteTarget.id)
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
      setTotal((prev) => prev - 1)
      toast.success(`${deleteTarget.displayName} eliminado`)
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar')
    } finally {
      setDeleteTarget(null)
    }
  }

  async function handleResetPassword() {
    if (!resetTarget || newPassword.length < 6) return
    setResetting(true)
    try {
      await adminApi.resetPassword(resetTarget.id, newPassword)
      toast.success(`Contraseña de ${resetTarget.displayName} actualizada`)
      setResetTarget(null)
      setNewPassword('')
    } catch (err: any) {
      toast.error(err.message || 'Error al resetear contraseña')
    } finally {
      setResetting(false)
    }
  }

  async function handleVerifyEmail(user: AdminUser) {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/users/${user.id}/verify-email`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error()
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isEmailVerified: true } : u))
      toast.success(`Correo de ${user.displayName} verificado`)
    } catch {
      toast.error('Error al verificar correo')
    }
  }

  async function handleAssignPlan(user: AdminUser, planId: string | null) {
    try {
      await adminApi.assignPlan(user.id, planId)
      const plan = plans.find((p) => p.id === planId) ?? null
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, plan: plan ? { id: plan.id, name: plan.name } : null } : u))
      toast.success('Plan actualizado')
    } catch (err: any) {
      toast.error(err.message || 'Error')
    }
  }

  return (
    <div className="space-y-5">
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

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
          <Search size={15} style={{ color: 'var(--muted)' }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, usuario o email…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text)' }}
          />
        </div>
        <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--accent)', color: '#0b0d12' }}>
          Buscar
        </button>
      </form>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-2 flex-wrap p-3 rounded-2xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--accent)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
            {selected.size} seleccionado(s)
          </span>
          <button onClick={() => setSelected(new Set())}
            className="text-xs px-2 py-1 rounded-lg transition hover:opacity-70"
            style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
            Deseleccionar
          </button>
          <div className="flex-1" />
          <button onClick={() => handleBulkAction('activate')} disabled={bulkActing}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition hover:opacity-70 disabled:opacity-40"
            style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--accent)' }}>
            Activar
          </button>
          <button onClick={() => handleBulkAction('deactivate')} disabled={bulkActing}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition hover:opacity-70 disabled:opacity-40"
            style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)' }}>
            Desactivar
          </button>
          {plans.length > 0 && (
            <div className="flex items-center gap-1">
              <select
                value={bulkPlanId}
                onChange={(e) => setBulkPlanId(e.target.value)}
                className="text-xs rounded-lg px-2 py-1.5 outline-none"
                style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--pt-border)' }}>
                <option value="">Sin plan</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button onClick={() => handleBulkAction('assign_plan', bulkPlanId || null)} disabled={bulkActing}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition hover:opacity-70 disabled:opacity-40"
                style={{ background: 'rgba(56,189,248,0.12)', color: 'var(--accent2)' }}>
                Asignar plan
              </button>
            </div>
          )}
          <button onClick={() => setBulkDeleteConfirm(true)} disabled={bulkActing}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition hover:opacity-70 disabled:opacity-40"
            style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--danger)' }}>
            <Trash2 size={12} />
            Eliminar
          </button>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
        <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--pt-border)' }}>
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="w-4 h-4 rounded cursor-pointer flex-shrink-0"
            style={{ accentColor: 'var(--accent)' }}
          />
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Usuarios <span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>({total})</span>
          </p>
        </div>

        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderTopColor: 'var(--accent)', borderRightColor: 'var(--pt-border)', borderBottomColor: 'var(--pt-border)', borderLeftColor: 'var(--pt-border)' }} />
          </div>
        ) : users.length === 0 ? (
          <p className="py-10 text-center text-sm" style={{ color: 'var(--muted)' }}>Sin resultados</p>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--pt-border)' }}>
            {users.map((user) => (
              <div key={user.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ background: selected.has(user.id) ? 'rgba(110,231,183,0.04)' : undefined }}>
                <input
                  type="checkbox"
                  checked={selected.has(user.id)}
                  onChange={() => toggleSelect(user.id)}
                  className="w-4 h-4 rounded cursor-pointer flex-shrink-0"
                  style={{ accentColor: 'var(--accent)' }}
                />
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'var(--surface2)', color: 'var(--accent)' }}>
                  {user.displayName[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{user.displayName}</p>
                    {user.username && (
                      <span className="text-xs shrink-0" style={{ color: 'var(--muted)' }}>@{user.username}</span>
                    )}
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{user.email}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {user.plan && (
                    <span className="text-xs px-2 py-0.5 rounded-full hidden sm:inline"
                      style={{ background: 'rgba(56,189,248,0.12)', color: 'var(--accent2)' }}>
                      {user.plan.name}
                    </span>
                  )}
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
                  {plans.length > 0 && (
                    <select
                      value={user.plan?.id ?? ''}
                      onChange={(e) => handleAssignPlan(user, e.target.value || null)}
                      className="text-xs rounded-lg px-2 py-1 outline-none transition"
                      style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--pt-border)' }}
                      title="Asignar plan">
                      <option value="">Sin plan</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                  {!user.isEmailVerified && (
                    <button onClick={() => handleVerifyEmail(user)}
                      title="Marcar correo como verificado"
                      className="p-1.5 rounded-lg transition hover:opacity-70"
                      style={{ color: '#f59e0b' }}>
                      <MailCheck size={15} />
                    </button>
                  )}
                  <button onClick={() => { setResetTarget(user); setNewPassword('') }}
                    title="Resetear contraseña"
                    className="p-1.5 rounded-lg transition hover:opacity-70"
                    style={{ color: 'var(--muted)' }}>
                    <KeyRound size={15} />
                  </button>
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
                  <button onClick={() => setDeleteTarget(user)}
                    title="Eliminar usuario"
                    className="p-1.5 rounded-lg transition hover:opacity-70"
                    style={{ color: 'var(--danger)' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => fetchUsers(search, page - 1)} disabled={page <= 1}
            className="p-2 rounded-lg transition hover:opacity-70 disabled:opacity-30"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--pt-border)' }}>
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm" style={{ color: 'var(--muted)' }}>Página {page} de {pages}</span>
          <button onClick={() => fetchUsers(search, page + 1)} disabled={page >= pages}
            className="p-2 rounded-lg transition hover:opacity-70 disabled:opacity-30"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--pt-border)' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Reset password modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setResetTarget(null)}>
          <div className="w-full max-w-xs p-5 rounded-2xl space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}
            onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                Resetear contraseña
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                {resetTarget.displayName} · {resetTarget.email}
              </p>
            </div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nueva contraseña (mín. 6 caracteres)"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface2)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setResetTarget(null)}
                className="px-3 py-1.5 rounded-xl text-sm"
                style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetting || newPassword.length < 6}
                className="px-3 py-1.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: 'var(--accent)', color: '#0b0d12' }}>
                {resetting ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete single user */}
      <ConfirmModal
        open={!!deleteTarget}
        message={`¿Eliminar a "${deleteTarget?.displayName}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        dangerous
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Bulk delete confirm */}
      <ConfirmModal
        open={bulkDeleteConfirm}
        message={`¿Eliminar ${selected.size} usuario(s) seleccionados? Esta acción no se puede deshacer.`}
        confirmLabel={bulkActing ? 'Eliminando...' : 'Eliminar'}
        dangerous
        onConfirm={() => handleBulkAction('delete')}
        onCancel={() => setBulkDeleteConfirm(false)}
      />
    </div>
  )
}

// ─── Plans Tab ────────────────────────────────────────────────────────────────

function PlansTab() {
  const router = useRouter()
  const { toDOP } = useExchangeRate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null)

  // Tasa de cambio
  const [savedRate, setSavedRate] = useState<{ rate: number; updatedAt: string } | null>(null)
  const [liveRate, setLiveRate] = useState<number | null>(null)
  const [fetchingRate, setFetchingRate] = useState(false)
  const [savingRate, setSavingRate] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  const authHdr = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try { setPlans((await adminApi.listPlans()).data) }
    catch { toast.error('Error al cargar planes') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchPlans()
    fetch('/api/admin/exchange-rate', { headers: authHdr })
      .then((r) => r.json())
      .then((j) => j.data && setSavedRate(j.data))
      .catch(() => {})
  }, [fetchPlans])

  async function fetchLiveRate() {
    setFetchingRate(true)
    setLiveRate(null)
    try {
      const res = await fetch('/api/admin/exchange-rate', { method: 'PUT', headers: authHdr })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error)
      setLiveRate(j.data.rate)
    } catch { toast.error('No se pudo obtener la tasa actual') }
    finally { setFetchingRate(false) }
  }

  async function saveRate(rate: number) {
    setSavingRate(true)
    try {
      const res = await fetch('/api/admin/exchange-rate', { method: 'POST', headers: authHdr, body: JSON.stringify({ rate }) })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error)
      setSavedRate({ rate, updatedAt: new Date().toISOString() })
      setLiveRate(null)
      toast.success('Tasa guardada')
    } catch { toast.error('Error al guardar') }
    finally { setSavingRate(false) }
  }

  async function handleDelete(plan: Plan) {
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, { method: 'DELETE', headers: authHdr })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setPlans((prev) => prev.filter((p) => p.id !== plan.id))
      toast.success('Plan eliminado')
    } catch (err: any) { toast.error(err.message || 'Error al eliminar') }
    finally { setDeleteTarget(null) }
  }

  return (
    <div className="space-y-4">

      {/* Tasa de cambio USD → DOP */}
      <div className="p-4 rounded-2xl space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Tasa de cambio USD → DOP</p>
            {savedRate ? (
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Guardada: <span style={{ color: 'var(--accent)' }}>RD${savedRate.rate.toFixed(2)}</span>
                {' · '}{new Date(savedRate.updatedAt).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            ) : (
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Sin tasa guardada — se usa valor aproximado</p>
            )}
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button onClick={() => setLiveRate(savedRate?.rate ?? 60)} disabled={fetchingRate}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer disabled:opacity-50"
                    style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--pt-border)' }}>
              Ingresar manual
            </button>
            <button onClick={fetchLiveRate} disabled={fetchingRate}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer disabled:opacity-50"
                    style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--pt-border)' }}>
              {fetchingRate ? 'Consultando...' : '↻ Obtener tasa actual'}
            </button>
          </div>
        </div>

        {liveRate !== null && (
          <div className="p-3 rounded-xl space-y-2"
               style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Edita el valor si lo necesitas antes de guardar:</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center flex-1 gap-2 px-3 py-2 rounded-xl"
                   style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
                <span className="text-sm font-medium flex-shrink-0" style={{ color: 'var(--muted)' }}>RD$</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={liveRate}
                  onChange={(e) => setLiveRate(Number(e.target.value))}
                  className="flex-1 bg-transparent text-sm font-semibold outline-none"
                  style={{ color: 'var(--accent)' }}
                />
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>por $1 USD</span>
              </div>
              <button onClick={() => saveRate(liveRate)} disabled={savingRate || !liveRate}
                      className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50 flex-shrink-0"
                      style={{ background: 'var(--accent)', color: '#0b0d12' }}>
                {savingRate ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>{plans.length} plan(es) configurados</p>
        <button onClick={() => router.push('/admin/planes/nuevo')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-80"
                style={{ background: 'var(--accent)', color: '#0b0d12' }}>
          <Plus size={14} /> Nuevo plan
        </button>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center">
          <div className="w-6 h-6 border-2 rounded-full animate-spin"
               style={{ borderTopColor: 'var(--accent)', borderColor: 'var(--pt-border)' }} />
        </div>
      ) : plans.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <CreditCard size={32} className="mx-auto" style={{ color: 'var(--muted)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No hay planes configurados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-2xl p-4 space-y-3"
                 style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold" style={{ color: 'var(--text)' }}>{plan.name}</p>
                    {plan.price != null && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: 'rgba(56,189,248,0.12)', color: 'var(--accent2)' }}>
                        ${plan.price} · RD${toDOP(plan.price)}/mes
                      </span>
                    )}
                    {plan.isDefault && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--accent)' }}>
                        Por defecto
                      </span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{plan._count.users} usuario(s)</span>
                  </div>
                  {plan.description && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{plan.description}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => router.push(`/admin/planes/${plan.id}/editar`)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-70 cursor-pointer"
                          style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
                    Editar
                  </button>
                  <button onClick={() => setDeleteTarget(plan)}
                          className="p-1.5 rounded-lg hover:opacity-70 cursor-pointer"
                          style={{ color: 'var(--danger)' }} title="Eliminar">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {plan.features.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                  {plan.features.map((f) => {
                    const label = FEATURE_LABELS[f.featureKey as keyof typeof FEATURE_LABELS]
                    return (
                      <span key={f.id} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                            style={{ background: 'rgba(16,185,129,0.08)', color: 'var(--accent)' }}>
                        <Check size={10} style={{ flexShrink: 0 }} />
                        <span className="truncate">{label?.label ?? f.featureKey}</span>
                      </span>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Plan base — sin funcionalidades adicionales</p>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        message={`¿Eliminar el plan "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar" dangerous
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ─── Pensums Tab ──────────────────────────────────────────────────────────────

function PensumsTab() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [careers, setCareers] = useState<CareerVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<ParsedPensum | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)
  const [copied, setCopied] = useState(false)

  // University / career assignment
  const [universities, setUniversities] = useState<UniversityAdmin[]>([])
  const [uniCareers, setUniCareers] = useState<CareerAdmin[]>([])
  const [selectedUniId, setSelectedUniId] = useState<string>('')
  const [selectedCareerId, setSelectedCareerId] = useState<string>('')
  const [loadingUniCareers, setLoadingUniCareers] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const fetchCareers = useCallback(async () => {
    setLoading(true)
    try {
      const r = await pensumApi.list()
      setCareers(r.data)
    } catch { toast.error('Error al cargar pensums') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCareers() }, [fetchCareers])

  async function processFile(file: File) {
    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      toast.error('Solo se aceptan archivos .md o .txt')
      return
    }
    setPreviewing(true)
    setPreview(null)
    setSelectedUniId('')
    setSelectedCareerId('')
    setUniCareers([])
    try {
      const [r, uR] = await Promise.all([pensumApi.preview(file), adminApi.listUniversities()])
      setPreview(r.data)
      setUniversities(uR.data)
    } catch (err: any) {
      toast.error(err.message || 'Error al leer el archivo')
    } finally {
      setPreviewing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (previewing) return
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  async function handleSelectUniversity(uniId: string) {
    setSelectedUniId(uniId)
    setSelectedCareerId('')
    setUniCareers([])
    if (uniId && uniId !== 'new') {
      setLoadingUniCareers(true)
      try {
        const r = await adminApi.listCareers(uniId)
        setUniCareers(r.data)
      } catch { /* ignore */ }
      finally { setLoadingUniCareers(false) }
    }
  }

  async function handleImport() {
    if (!preview || !selectedUniId || !selectedCareerId) return
    setImporting(true)
    try {
      const uniId = selectedUniId === 'new' ? undefined : selectedUniId
      const carId = selectedCareerId === 'new' ? undefined : selectedCareerId
      await pensumApi.import(preview, uniId, carId)
      toast.success('Pensum importado correctamente')
      setPreview(null)
      setSelectedUniId('')
      setSelectedCareerId('')
      setUniCareers([])
      fetchCareers()
    } catch (err: any) {
      toast.error(err.message || 'Error al importar')
    } finally {
      setImporting(false)
    }
  }

  async function handleToggleActive(career: CareerVersion) {
    try {
      await pensumApi.toggleActive(career.id, !career.isActive)
      setCareers((prev) => prev.map((c) => c.id === career.id ? { ...c, isActive: !c.isActive } : c))
    } catch (err: any) {
      toast.error(err.message || 'Error')
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(PENSUM_TEMPLATE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const periodLabel = (type: string) => PERIOD_LABELS[type] ?? type

  return (
    <div className="space-y-5">
      {/* Upload */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!previewing) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className="rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center transition-colors"
        style={{
          background: dragOver ? 'rgba(110,231,183,0.06)' : 'var(--surface)',
          border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--pt-border)'}`,
          cursor: previewing ? 'default' : 'default',
        }}>
        <Upload size={24} style={{ color: dragOver ? 'var(--accent)' : 'var(--muted)' }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: dragOver ? 'var(--accent)' : 'var(--text)' }}>
            {previewing ? 'Leyendo archivo...' : 'Arrastra el archivo aquí'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            o selecciónalo desde tu dispositivo · <code>.md</code> o <code>.txt</code>
          </p>
        </div>
        {!previewing && (
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent)', color: '#0b0d12' }}>
            <Upload size={14} />
            Seleccionar archivo
            <input ref={fileRef} type="file" accept=".md,.txt" className="hidden" onChange={handleFile} />
          </label>
        )}
        {previewing && (
          <div className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderTopColor: 'var(--accent)', borderRightColor: 'var(--pt-border)', borderBottomColor: 'var(--pt-border)', borderLeftColor: 'var(--pt-border)' }} />
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="rounded-2xl p-4 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Vista previa</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Revisa antes de confirmar la importación</p>
            </div>
            <button onClick={() => setPreview(null)} className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Universidad', value: preview.university },
              { label: 'Carrera', value: preview.career },
              { label: 'Año', value: preview.year },
              { label: 'Tipo de período', value: periodLabel(preview.periodType) },
              { label: 'Créditos totales', value: preview.totalCredits },
              { label: `${periodLabel(preview.periodType)}s`, value: preview.durationSemesters },
              { label: 'Materias detectadas', value: preview.subjects.length },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: 'var(--surface2)' }}>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{label}</p>
                <p className="text-sm font-semibold mt-0.5 break-words" style={{ color: 'var(--text)' }}>{value}</p>
              </div>
            ))}
          </div>

          {preview.warnings.length > 0 && (
            <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <p className="text-xs font-semibold flex items-center gap-1" style={{ color: '#fbbf24' }}>
                <AlertTriangle size={13} /> {preview.warnings.length} advertencia(s)
              </p>
              {preview.warnings.map((w, i) => (
                <p key={i} className="text-xs" style={{ color: '#fbbf24' }}>• {w}</p>
              ))}
            </div>
          )}

          {/* Asignar universidad y carrera */}
          <div className="space-y-3 rounded-xl p-3" style={{ background: 'var(--surface2)', border: '1px solid var(--pt-border)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Asignar a universidad y carrera</p>

            <div className="space-y-1">
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Universidad detectada: <span style={{ color: 'var(--text)' }}>"{preview.university}"</span>
              </p>
              <select
                value={selectedUniId}
                onChange={(e) => handleSelectUniversity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}>
                <option value="">— Selecciona universidad —</option>
                <option value="new">+ Crear nueva: "{preview.university}"</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>{u.shortName} — {u.name}</option>
                ))}
              </select>
            </div>

            {selectedUniId && (
              <div className="space-y-1">
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Carrera detectada: <span style={{ color: 'var(--text)' }}>"{preview.career}"</span>
                </p>
                <select
                  value={selectedCareerId}
                  onChange={(e) => setSelectedCareerId(e.target.value)}
                  disabled={loadingUniCareers}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none disabled:opacity-60"
                  style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}>
                  <option value="">— Selecciona carrera —</option>
                  <option value="new">+ Crear nueva: "{preview.career}"</option>
                  {uniCareers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button onClick={handleImport} disabled={importing || !selectedUniId || !selectedCareerId}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent)', color: '#0b0d12' }}>
            <CheckCircle size={15} />
            {importing ? 'Importando...' : 'Confirmar importación'}
          </button>
        </div>
      )}

      {/* Imported careers list */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--pt-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Pensums importados <span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>({careers.length})</span>
          </p>
        </div>

        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderTopColor: 'var(--accent)', borderRightColor: 'var(--pt-border)', borderBottomColor: 'var(--pt-border)', borderLeftColor: 'var(--pt-border)' }} />
          </div>
        ) : careers.length === 0 ? (
          <p className="py-10 text-center text-sm" style={{ color: 'var(--muted)' }}>No hay pensums importados aún</p>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--pt-border)' }}>
            {careers.map((career) => (
              <div key={career.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{career.name}</p>
                    {career.year && (
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
                        {career.year}
                      </span>
                    )}
                    {career.isActive ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                        style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--accent)' }}>
                        Activo
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)' }}>
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {career.university.name} · {periodLabel(career.periodType)} · {career._count.subjects} materias · {career._count.profiles} estudiantes
                  </p>
                </div>
                <button onClick={() => handleToggleActive(career)}
                  title={career.isActive ? 'Desactivar' : 'Activar'}
                  className="p-1.5 rounded-lg transition hover:opacity-70 shrink-0"
                  style={{ color: career.isActive ? 'var(--accent)' : 'var(--muted)' }}>
                  {career.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Format reference */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
        <button
          onClick={() => setShowTemplate((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ color: 'var(--text)' }}>
          <span>Formato de referencia (.md / .txt)</span>
          {showTemplate ? <EyeOff size={15} style={{ color: 'var(--muted)' }} /> : <Eye size={15} style={{ color: 'var(--muted)' }} />}
        </button>

        {showTemplate && (
          <div style={{ borderTop: '1px solid var(--pt-border)' }}>
            <div className="flex justify-end px-4 py-2" style={{ borderBottom: '1px solid var(--pt-border)' }}>
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
                style={{ background: 'var(--surface2)', color: copied ? 'var(--accent)' : 'var(--muted)' }}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <pre className="p-4 text-xs overflow-x-auto" style={{ color: 'var(--muted)', fontFamily: 'monospace' }}>
              {PENSUM_TEMPLATE}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Universidades Tab ────────────────────────────────────────────────────────

function UniversidadesTab() {
  const [universities, setUniversities] = useState<UniversityAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<UniversityAdmin | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UniversityAdmin | null>(null)
  const [form, setForm] = useState({ name: '', shortName: '', country: 'DO', logoUrl: '' })
  const [saving, setSaving] = useState(false)

  const fetchUniversities = useCallback(async () => {
    setLoading(true)
    try {
      const r = await adminApi.listUniversities()
      setUniversities(r.data)
    } catch { toast.error('Error al cargar universidades') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchUniversities() }, [fetchUniversities])

  function openCreate() {
    setEditTarget(null)
    setForm({ name: '', shortName: '', country: 'DO', logoUrl: '' })
    setShowForm(true)
  }

  function openEdit(u: UniversityAdmin) {
    setEditTarget(u)
    setForm({ name: u.name, shortName: u.shortName, country: u.country, logoUrl: u.logoUrl ?? '' })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, logoUrl: form.logoUrl.trim() || null }
      if (editTarget) {
        const r = await adminApi.updateUniversity(editTarget.id, payload)
        setUniversities((prev) => prev.map((u) => u.id === editTarget.id ? r.data : u))
        toast.success('Universidad actualizada')
      } else {
        const r = await adminApi.createUniversity(payload)
        setUniversities((prev) => [...prev, r.data])
        toast.success('Universidad creada')
      }
      setShowForm(false)
    } catch (err: any) {
      toast.error(err.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(u: UniversityAdmin) {
    try {
      await adminApi.updateUniversity(u.id, { isActive: !u.isActive })
      setUniversities((prev) => prev.map((x) => x.id === u.id ? { ...x, isActive: !x.isActive } : x))
    } catch (err: any) {
      toast.error(err.message || 'Error')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await adminApi.deleteUniversity(deleteTarget.id)
      setUniversities((prev) => prev.filter((u) => u.id !== deleteTarget.id))
      toast.success('Universidad eliminada')
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>{universities.length} universidad(es)</p>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'var(--accent)', color: '#0b0d12' }}>
          <Plus size={14} /> Nueva
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="rounded-2xl p-4 space-y-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {editTarget ? 'Editar universidad' : 'Nueva universidad'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--muted)' }}>Nombre completo *</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Universidad APEC"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface2)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--muted)' }}>Nombre corto *</label>
              <input required value={form.shortName} onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))}
                placeholder="Ej: UNAPEC"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface2)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--muted)' }}>País</label>
              <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                placeholder="DO"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface2)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--muted)' }}>URL del logo</label>
              <input value={form.logoUrl} onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface2)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-xl text-sm"
              style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-3 py-1.5 rounded-xl text-sm font-semibold disabled:opacity-60"
              style={{ background: 'var(--accent)', color: '#0b0d12' }}>
              {saving ? 'Guardando...' : (editTarget ? 'Guardar cambios' : 'Crear')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-10 flex justify-center">
          <div className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderTopColor: 'var(--accent)', borderRightColor: 'var(--pt-border)', borderBottomColor: 'var(--pt-border)', borderLeftColor: 'var(--pt-border)' }} />
        </div>
      ) : universities.length === 0 ? (
        <p className="py-10 text-center text-sm" style={{ color: 'var(--muted)' }}>No hay universidades registradas</p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
          <div className="divide-y" style={{ borderColor: 'var(--pt-border)' }}>
            {universities.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{u.name}</p>
                    <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                      style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
                      {u.shortName}
                    </span>
                    {!u.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)' }}>
                        Inactiva
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {u.country} · {u._count.careers} carrera(s)
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(u)} title="Editar"
                    className="p-1.5 rounded-lg transition hover:opacity-70"
                    style={{ color: 'var(--muted)' }}>
                    <BookOpen size={15} />
                  </button>
                  <button onClick={() => handleToggleActive(u)}
                    title={u.isActive ? 'Desactivar' : 'Activar'}
                    className="p-1.5 rounded-lg transition hover:opacity-70"
                    style={{ color: u.isActive ? 'var(--accent)' : 'var(--muted)' }}>
                    {u.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => setDeleteTarget(u)} title="Eliminar"
                    className="p-1.5 rounded-lg transition hover:opacity-70"
                    style={{ color: 'var(--danger)' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        message={`¿Eliminar "${deleteTarget?.name}"? Solo es posible si no tiene carreras asociadas.`}
        confirmLabel="Eliminar"
        dangerous
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ─── Carreras Tab ─────────────────────────────────────────────────────────────

function CarrerasTab() {
  const [careers, setCareers] = useState<CareerAdmin[]>([])
  const [universities, setUniversities] = useState<UniversityAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CareerAdmin | null>(null)
  const [form, setForm] = useState({ name: '', universityId: '' })
  const [saving, setSaving] = useState(false)
  const [filterUni, setFilterUni] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [cR, uR] = await Promise.all([adminApi.listCareers(), adminApi.listUniversities()])
      setCareers(cR.data)
      setUniversities(uR.data)
      if (!form.universityId && uR.data.length > 0) {
        setForm((f) => ({ ...f, universityId: uR.data[0].id }))
      }
    } catch { toast.error('Error al cargar datos') }
    finally { setLoading(false) }
  }, [])  // eslint-disable-line

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await adminApi.createCareer(form)
      setCareers((prev) => [...prev, r.data])
      toast.success('Carrera creada')
      setShowForm(false)
      setForm((f) => ({ ...f, name: '' }))
    } catch (err: any) {
      toast.error(err.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(c: CareerAdmin) {
    try {
      await adminApi.updateCareer(c.id, { isActive: !c.isActive })
      setCareers((prev) => prev.map((x) => x.id === c.id ? { ...x, isActive: !x.isActive } : x))
    } catch (err: any) {
      toast.error(err.message || 'Error')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await adminApi.deleteCareer(deleteTarget.id)
      setCareers((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      toast.success('Carrera eliminada')
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar')
    } finally {
      setDeleteTarget(null)
    }
  }

  const filtered = filterUni ? careers.filter((c) => c.universityId === filterUni) : careers

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <select
          value={filterUni}
          onChange={(e) => setFilterUni(e.target.value)}
          className="text-sm rounded-xl px-3 py-2 outline-none flex-1 min-w-0 max-w-xs"
          style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}>
          <option value="">Todas las universidades</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>{u.shortName} — {u.name}</option>
          ))}
        </select>
        <button onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 flex-shrink-0"
          style={{ background: 'var(--accent)', color: '#0b0d12' }}>
          <Plus size={14} /> Nueva
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="rounded-2xl p-4 space-y-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Nueva carrera</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--muted)' }}>Nombre *</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Ingeniería en Sistemas"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface2)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--muted)' }}>Universidad *</label>
              <select required value={form.universityId} onChange={(e) => setForm((f) => ({ ...f, universityId: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface2)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}>
                <option value="">Selecciona...</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>{u.shortName} — {u.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-xl text-sm"
              style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-3 py-1.5 rounded-xl text-sm font-semibold disabled:opacity-60"
              style={{ background: 'var(--accent)', color: '#0b0d12' }}>
              {saving ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-10 flex justify-center">
          <div className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderTopColor: 'var(--accent)', borderRightColor: 'var(--pt-border)', borderBottomColor: 'var(--pt-border)', borderLeftColor: 'var(--pt-border)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm" style={{ color: 'var(--muted)' }}>No hay carreras</p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
          <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--pt-border)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{filtered.length} carrera(s)</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--pt-border)' }}>
            {filtered.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{c.name}</p>
                    {!c.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)' }}>
                        Inactiva
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {c.university.shortName} · {c._count.pensums} pensum(s) · {c._count.profiles} estudiante(s)
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleToggleActive(c)}
                    title={c.isActive ? 'Desactivar' : 'Activar'}
                    className="p-1.5 rounded-lg transition hover:opacity-70"
                    style={{ color: c.isActive ? 'var(--accent)' : 'var(--muted)' }}>
                    {c.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => setDeleteTarget(c)} title="Eliminar"
                    className="p-1.5 rounded-lg transition hover:opacity-70"
                    style={{ color: 'var(--danger)' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        message={`¿Eliminar "${deleteTarget?.name}"? Solo es posible si no tiene pensums asociados.`}
        confirmLabel="Eliminar"
        dangerous
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ─── Requests Tab ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PensumRequestStatus, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'Pendiente',   color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  IN_REVIEW: { label: 'En revisión', color: 'var(--accent2)', bg: 'rgba(56,189,248,0.1)' },
  COMPLETED: { label: 'Completado',  color: 'var(--accent)',  bg: 'rgba(16,185,129,0.1)' },
  REJECTED:  { label: 'Rechazado',   color: 'var(--danger)',  bg: 'rgba(248,113,113,0.1)' },
}

const NEXT_STATUS: Record<PensumRequestStatus, PensumRequestStatus | null> = {
  PENDING:   'IN_REVIEW',
  IN_REVIEW: 'COMPLETED',
  COMPLETED: null,
  REJECTED:  null,
}

function RequestsTab() {
  const [requests, setRequests] = useState<PensumRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<PensumRequestStatus | 'ALL'>('ALL')

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const r = await pensumRequestsApi.listAdmin()
      setRequests(r.data)
    } catch { toast.error('Error al cargar solicitudes') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  async function handleStatus(req: PensumRequest, status: PensumRequestStatus) {
    try {
      await pensumRequestsApi.updateStatus(req.id, status)
      setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status } : r))
    } catch (err: any) {
      toast.error(err.message || 'Error')
    }
  }

  const filtered = filter === 'ALL' ? requests : requests.filter((r) => r.status === filter)
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['ALL', 'PENDING', 'IN_REVIEW', 'COMPLETED', 'REJECTED'] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: filter === s ? (s === 'ALL' ? 'var(--accent)' : STATUS_CONFIG[s as PensumRequestStatus]?.bg ?? 'var(--accent)') : 'var(--surface)',
              color: filter === s ? (s === 'ALL' ? '#0b0d12' : STATUS_CONFIG[s as PensumRequestStatus]?.color ?? '#0b0d12') : 'var(--muted)',
              border: '1px solid var(--pt-border)',
            }}>
            {s === 'ALL' ? `Todas (${requests.length})` : `${STATUS_CONFIG[s].label}${s === 'PENDING' && pendingCount > 0 ? ` (${pendingCount})` : ''}`}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderTopColor: 'var(--accent)', borderRightColor: 'var(--pt-border)', borderBottomColor: 'var(--pt-border)', borderLeftColor: 'var(--pt-border)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm" style={{ color: 'var(--muted)' }}>No hay solicitudes</p>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--pt-border)' }}>
            {filtered.map((req) => {
              const cfg = STATUS_CONFIG[req.status]
              const next = NEXT_STATUS[req.status]
              return (
                <div key={req.id} className="px-4 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{req.career}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {req.university}{req.year ? ` · ${req.year}` : ''} · {req.periodType === 'semester' ? 'Semestral' : req.periodType === 'quarter' ? 'Cuatrimestral' : 'Trimestral'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        Solicitado por {req.user.displayName}{req.user.username ? ` (@${req.user.username})` : ''} · {new Date(req.createdAt).toLocaleDateString('es-DO')}
                      </p>
                    </div>
                    {next && (
                      <button onClick={() => handleStatus(req, next)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium shrink-0 transition-opacity hover:opacity-70"
                        style={{ background: STATUS_CONFIG[next].bg, color: STATUS_CONFIG[next].color, border: `1px solid ${STATUS_CONFIG[next].color}33` }}>
                        → {STATUS_CONFIG[next].label}
                      </button>
                    )}
                    {req.status === 'IN_REVIEW' && (
                      <button onClick={() => handleStatus(req, 'REJECTED')}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium shrink-0 transition-opacity hover:opacity-70"
                        style={{ background: STATUS_CONFIG.REJECTED.bg, color: STATUS_CONFIG.REJECTED.color }}>
                        Rechazar
                      </button>
                    )}
                  </div>
                  {req.link && (
                    <a href={req.link} target="_blank" rel="noopener noreferrer"
                      className="text-xs underline break-all" style={{ color: 'var(--accent2)' }}>
                      {req.link}
                    </a>
                  )}
                  {req.comment && (
                    <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
                      {req.comment}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Profesores Admin Tab ──────────────────────────────────────────────────────

type ProfReq = { id: string; name: string; subjects: string[]; schedule: string; bio: string | null; comment: string | null; status: string; createdAt: string; user: { id: string; displayName: string; email: string }; university: { id: string; name: string; shortName: string } | null; universityName: string | null }
type ProfUpdateReq = { id: string; details: string; status: string; createdAt: string; user: { id: string; displayName: string; email: string }; professor: { id: string; name: string } }
type AdminProf = { id: string; name: string; bio: string | null; status: string; teachings: { id: string; subjectName: string; schedule: string; university: { id: string; name: string; shortName: string } }[]; _count: { ratings: number; comments: number } }

const SCHED_LABELS: Record<string, string> = { MORNING: 'Mañana', AFTERNOON: 'Tarde', NIGHT: 'Noche' }
const REQ_STATUS_LABELS: Record<string, string> = { PENDING: 'Pendiente', IN_REVIEW: 'En revisión', COMPLETED: 'Aprobada', REJECTED: 'Rechazada' }

function ProfesoresAdminTab() {
  const [subTab, setSubTab] = useState<'profesores' | 'solicitudes' | 'actualizaciones'>('profesores')
  const [professors, setProfessors] = useState<AdminProf[]>([])
  const [profRequests, setProfRequests] = useState<ProfReq[]>([])
  const [updateRequests, setUpdateRequests] = useState<ProfUpdateReq[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createBio, setCreateBio] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [teachingProfId, setTeachingProfId] = useState<string | null>(null)
  const [teachingUniversityId, setTeachingUniversityId] = useState('')
  const [teachingSubject, setTeachingSubject] = useState('')
  const [teachingSchedule, setTeachingSchedule] = useState('MORNING')
  const [teachingLoading, setTeachingLoading] = useState(false)
  const [adminUnis, setAdminUnis] = useState<{ id: string; name: string; shortName: string }[]>([])
  const [teachingSubjects, setTeachingSubjects] = useState<string[]>([])
  const [teachingSubjectsLoading, setTeachingSubjectsLoading] = useState(false)

  function authHdr(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
  }

  async function loadAll() {
    setLoading(true)
    try {
      const [p, pr, ur] = await Promise.all([
        fetch('/api/admin/professors', { headers: authHdr() }).then((r) => r.json()),
        fetch('/api/admin/professor-requests', { headers: authHdr() }).then((r) => r.json()),
        fetch('/api/admin/professor-update-requests', { headers: authHdr() }).then((r) => r.json()),
      ])
      setProfessors(p.data ?? []); setProfRequests(pr.data ?? []); setUpdateRequests(ur.data ?? [])
    } catch { toast.error('Error al cargar') } finally { setLoading(false) }
  }

  useEffect(() => {
    loadAll()
    fetch('/api/universities').then((r) => r.json()).then((j) => setAdminUnis(j.data ?? []))
  }, [])

  useEffect(() => {
    if (!teachingUniversityId) { setTeachingSubjects([]); return }
    setTeachingSubjectsLoading(true)
    setTeachingSubject('')
    fetch(`/api/universities/${teachingUniversityId}/subjects`)
      .then((r) => r.json()).then((j) => setTeachingSubjects(j.data ?? []))
      .catch(() => setTeachingSubjects([]))
      .finally(() => setTeachingSubjectsLoading(false))
  }, [teachingUniversityId])

  const pendingProf = profRequests.filter((r) => r.status === 'PENDING' || r.status === 'IN_REVIEW').length
  const pendingUpd = updateRequests.filter((r) => r.status === 'PENDING' || r.status === 'IN_REVIEW').length

  async function doCreateProf(e: React.FormEvent) {
    e.preventDefault(); setCreateLoading(true)
    try {
      const res = await fetch('/api/admin/professors', { method: 'POST', headers: authHdr(), body: JSON.stringify({ name: createName, bio: createBio || undefined }) })
      const json = await res.json(); if (!res.ok) throw new Error(json.error)
      toast.success('Profesor creado'); setCreateName(''); setCreateBio(''); setShowCreate(false); loadAll()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Error') } finally { setCreateLoading(false) }
  }

  async function doAddTeaching(e: React.FormEvent) {
    e.preventDefault(); if (!teachingProfId) return; setTeachingLoading(true)
    try {
      const res = await fetch(`/api/admin/professors/${teachingProfId}/teachings`, { method: 'POST', headers: authHdr(), body: JSON.stringify({ universityId: teachingUniversityId, subjectName: teachingSubject, schedule: teachingSchedule }) })
      const json = await res.json(); if (!res.ok) throw new Error(json.error)
      toast.success('Materia agregada'); setTeachingProfId(null); setTeachingUniversityId(''); setTeachingSubject(''); setTeachingSchedule('MORNING'); setTeachingSubjects([]); loadAll()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Error') } finally { setTeachingLoading(false) }
  }

  async function doProfReq(id: string, status: 'COMPLETED' | 'REJECTED') {
    const res = await fetch(`/api/admin/professor-requests/${id}`, { method: 'PATCH', headers: authHdr(), body: JSON.stringify({ status }) })
    const json = await res.json(); if (!res.ok) return toast.error(json.error)
    toast.success(status === 'COMPLETED' ? 'Aprobada' : 'Rechazada'); loadAll()
  }

  async function doUpdReq(id: string, status: 'COMPLETED' | 'REJECTED') {
    const res = await fetch(`/api/admin/professor-update-requests/${id}`, { method: 'PATCH', headers: authHdr(), body: JSON.stringify({ status }) })
    const json = await res.json(); if (!res.ok) return toast.error(json.error)
    toast.success(status === 'COMPLETED' ? 'Aplicada' : 'Rechazada'); loadAll()
  }

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} /></div>

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(['profesores', 'solicitudes', 'actualizaciones'] as const).map((k) => {
          const label = k === 'solicitudes' ? `Solicitudes${pendingProf > 0 ? ` (${pendingProf})` : ''}` : k === 'actualizaciones' ? `Actualizaciones${pendingUpd > 0 ? ` (${pendingUpd})` : ''}` : 'Profesores'
          return <button key={k} onClick={() => setSubTab(k)} className="px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer" style={{ background: subTab === k ? 'var(--accent)' : 'var(--surface)', color: subTab === k ? '#0b0d12' : 'var(--muted)' }}>{label}</button>
        })}
      </div>

      {subTab === 'profesores' && (
        <div className="space-y-3">
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: 'var(--accent)', color: '#0b0d12' }}><Plus size={15} /> Agregar profesor</button>
          {showCreate && (
            <form onSubmit={doCreateProf} className="p-4 rounded-2xl space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
              <input value={createName} onChange={(e) => setCreateName(e.target.value)} required placeholder="Nombre del profesor" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
              <textarea value={createBio} onChange={(e) => setCreateBio(e.target.value)} placeholder="Descripción (opcional)" rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: 'var(--bg)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-xl text-sm cursor-pointer" style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>Cancelar</button>
                <button type="submit" disabled={createLoading} className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 cursor-pointer" style={{ background: 'var(--accent)', color: '#0b0d12' }}>{createLoading ? 'Creando...' : 'Crear'}</button>
              </div>
            </form>
          )}
          {professors.map((p) => (
            <div key={p.id} className="p-4 rounded-2xl space-y-2" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{p.name}</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>⭐ {p._count.ratings} · 💬 {p._count.comments}</span>
                  <button onClick={() => setTeachingProfId(p.id)} className="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer" style={{ background: 'var(--surface2)', color: 'var(--accent)' }}>+ Materia</button>
                </div>
              </div>
              {p.teachings.length > 0 && <div className="flex flex-wrap gap-1.5">{p.teachings.map((t) => <span key={t.id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>{t.subjectName} · {t.university.shortName} · {SCHED_LABELS[t.schedule]}</span>)}</div>}
            </div>
          ))}
          {teachingProfId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
              <form onSubmit={doAddTeaching} className="w-full max-w-sm p-5 rounded-2xl space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
                <p className="font-bold" style={{ color: 'var(--text)' }}>Agregar materia</p>
                <select value={teachingUniversityId} onChange={(e) => setTeachingUniversityId(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer" style={{ background: 'var(--bg)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}><option value="">Seleccionar universidad</option>{adminUnis.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                {teachingSubjectsLoading ? (
                  <p className="text-sm px-3 py-2.5" style={{ color: 'var(--muted)' }}>Cargando materias...</p>
                ) : teachingSubjects.length > 0 ? (
                  <select value={teachingSubject} onChange={(e) => setTeachingSubject(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer" style={{ background: 'var(--bg)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}>
                    <option value="">Seleccionar materia</option>
                    {teachingSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input value={teachingSubject} onChange={(e) => setTeachingSubject(e.target.value)} required placeholder={teachingUniversityId ? 'Sin materias registradas — escribir nombre' : 'Primero selecciona una universidad'} disabled={!teachingUniversityId} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none disabled:opacity-50" style={{ background: 'var(--bg)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
                )}
                <select value={teachingSchedule} onChange={(e) => setTeachingSchedule(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer" style={{ background: 'var(--bg)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}>{[['MORNING','Mañana'],['AFTERNOON','Tarde'],['NIGHT','Noche']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setTeachingProfId(null); setTeachingUniversityId(''); setTeachingSubject(''); setTeachingSubjects([]) }} className="flex-1 py-2 rounded-xl text-sm cursor-pointer" style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>Cancelar</button>
                  <button type="submit" disabled={teachingLoading} className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 cursor-pointer" style={{ background: 'var(--accent)', color: '#0b0d12' }}>{teachingLoading ? 'Agregando...' : 'Agregar'}</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {subTab === 'solicitudes' && (
        <div className="space-y-3">
          {profRequests.length === 0 ? <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No hay solicitudes</p>
            : profRequests.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl space-y-2" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{r.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: r.status === 'PENDING' ? 'rgba(245,158,11,0.12)' : r.status === 'COMPLETED' ? 'rgba(16,185,129,0.12)' : 'rgba(248,113,113,0.12)', color: r.status === 'PENDING' ? '#f59e0b' : r.status === 'COMPLETED' ? '#10b981' : '#f87171' }}>{REQ_STATUS_LABELS[r.status]}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{r.university?.name ?? r.universityName ?? 'Sin universidad'} · {SCHED_LABELS[r.schedule]}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Materias: {r.subjects.join(', ')}</p>
                {r.comment && <p className="text-xs italic" style={{ color: 'var(--muted)' }}>{r.comment}</p>}
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Por: {r.user.displayName}</p>
                {(r.status === 'PENDING' || r.status === 'IN_REVIEW') && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => doProfReq(r.id, 'COMPLETED')} className="flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Aprobar</button>
                    <button onClick={() => doProfReq(r.id, 'REJECTED')} className="flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer" style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>Rechazar</button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {subTab === 'actualizaciones' && (
        <div className="space-y-3">
          {updateRequests.length === 0 ? <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No hay solicitudes</p>
            : updateRequests.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl space-y-2" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{r.professor.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: r.status === 'PENDING' ? 'rgba(245,158,11,0.12)' : r.status === 'COMPLETED' ? 'rgba(16,185,129,0.12)' : 'rgba(248,113,113,0.12)', color: r.status === 'PENDING' ? '#f59e0b' : r.status === 'COMPLETED' ? '#10b981' : '#f87171' }}>{REQ_STATUS_LABELS[r.status]}</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text)' }}>{r.details}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Por: {r.user.displayName}</p>
                {(r.status === 'PENDING' || r.status === 'IN_REVIEW') && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => doUpdReq(r.id, 'COMPLETED')} className="flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Marcar aplicada</button>
                    <button onClick={() => doUpdReq(r.id, 'REJECTED')} className="flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer" style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>Rechazar</button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

// ─── Pagos Admin Tab ──────────────────────────────────────────────────────────

type UpgradeReq = {
  id: string
  method: string
  confirmMethod: string | null
  proofUrl: string | null
  proofName: string | null
  status: string
  adminNotes: string | null
  createdAt: string
  user: { id: string; displayName: string; email: string; username: string | null }
  plan: { id: string; name: string; price: number | null }
}

function PagosAdminTab() {
  const [requests, setRequests] = useState<UpgradeReq[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [acting, setActing] = useState<string | null>(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  const authHdr = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/plan-upgrade-requests', { headers: authHdr })
      const j = await r.json()
      setRequests(j.data ?? [])
    } catch { toast.error('Error al cargar') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handle(id: string, status: 'APPROVED' | 'REJECTED') {
    setActing(id)
    try {
      const res = await fetch(`/api/admin/plan-upgrade-requests/${id}`, {
        method: 'PATCH', headers: authHdr,
        body: JSON.stringify({ status, adminNotes: notes[id] || null }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error)
      toast.success(status === 'APPROVED' ? 'Plan activado' : 'Rechazado')
      load()
    } catch (err: any) { toast.error(err.message || 'Error') }
    finally { setActing(null) }
  }

  const STATUS_LABELS: Record<string, string> = { PENDING: 'Pendiente', APPROVED: 'Aprobado', REJECTED: 'Rechazado' }
  const STATUS_COLORS: Record<string, string> = { PENDING: '#f59e0b', APPROVED: '#10b981', REJECTED: '#f87171' }
  const METHOD_LABELS: Record<string, string> = { transfer: 'Transferencia', paypal: 'PayPal' }
  const CONFIRM_LABELS: Record<string, string> = { app: '📎 Comprobante en app', email: '📧 Enviará por correo/WhatsApp' }

  const pending = requests.filter((r) => r.status === 'PENDING').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {pending > 0 ? (
            <span style={{ color: '#f59e0b' }}>{pending} solicitud(es) pendiente(s)</span>
          ) : 'Sin solicitudes pendientes'}
        </p>
        <button onClick={load} className="text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:opacity-70"
                style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center">
          <div className="w-6 h-6 border-2 rounded-full animate-spin"
               style={{ borderTopColor: 'var(--accent)', borderColor: 'var(--pt-border)' }} />
        </div>
      ) : requests.length === 0 ? (
        <div className="py-10 text-center">
          <CreditCard size={32} className="mx-auto mb-2" style={{ color: 'var(--muted)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No hay solicitudes de pago</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl p-4 space-y-3"
                 style={{ background: 'var(--surface)', border: `1px solid ${r.status === 'PENDING' ? 'rgba(245,158,11,0.3)' : 'var(--pt-border)'}` }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{r.user.displayName}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${STATUS_COLORS[r.status]}20`, color: STATUS_COLORS[r.status] }}>
                      {STATUS_LABELS[r.status]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
                      {METHOD_LABELS[r.method] ?? r.method}
                    </span>
                    {r.confirmMethod && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: r.confirmMethod === 'email' ? 'rgba(245,158,11,0.12)' : 'rgba(56,189,248,0.12)', color: r.confirmMethod === 'email' ? '#f59e0b' : 'var(--accent2)' }}>
                        {CONFIRM_LABELS[r.confirmMethod] ?? r.confirmMethod}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {r.user.email} {r.user.username ? `· @${r.user.username}` : ''}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    Plan solicitado: <span style={{ color: 'var(--text)' }}>{r.plan.name}</span>
                    {r.plan.price != null && ` ($${r.plan.price}/mes)`}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {new Date(r.createdAt).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Comprobante */}
              {r.proofUrl && (
                <a href={r.proofUrl} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 p-2 rounded-xl text-sm cursor-pointer hover:opacity-80"
                   style={{ background: 'var(--surface2)', color: 'var(--accent)', border: '1px solid var(--pt-border)' }}>
                  <Eye size={14} />
                  Ver comprobante {r.proofName ? `· ${r.proofName}` : ''}
                </a>
              )}

              {r.adminNotes && (
                <p className="text-xs italic" style={{ color: 'var(--muted)' }}>Nota: {r.adminNotes}</p>
              )}

              {r.status === 'PENDING' && (
                <div className="space-y-2">
                  <input
                    value={notes[r.id] ?? ''}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    placeholder="Nota opcional para el usuario..."
                    className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                    style={{ background: 'var(--surface2)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handle(r.id, 'APPROVED')} disabled={acting === r.id}
                            className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 cursor-pointer"
                            style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                      {acting === r.id ? '...' : '✓ Aprobar y activar plan'}
                    </button>
                    <button onClick={() => handle(r.id, 'REJECTED')} disabled={acting === r.id}
                            className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 cursor-pointer"
                            style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
                      {acting === r.id ? '...' : 'Rechazar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
