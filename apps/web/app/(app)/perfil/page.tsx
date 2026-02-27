'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { progressApi, userApi } from '@/services/api'
import { useAuthStore } from '@/store/useAuthStore'
import { GraduationCap, Building2, Check, Plus, LogOut, ChevronRight, Eye, EyeOff } from 'lucide-react'

export default function PerfilPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, updateUser, logout } = useAuthStore()

  // ─── Editar nombre ─────────────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameError, setNameError] = useState('')

  // ─── Cambiar contraseña ────────────────────────────────────────────────────
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // ─── Carreras ──────────────────────────────────────────────────────────────
  const [switchingId, setSwitchingId] = useState<string | null>(null)

  // ─── Logout ────────────────────────────────────────────────────────────────
  const [confirmLogout, setConfirmLogout] = useState(false)

  const { data: profilesData, isLoading: profilesLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => progressApi.profiles(),
  })

  const profiles = profilesData?.data ?? []

  // ─── Handlers nombre ───────────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!displayName.trim() || displayName === user?.displayName) {
      setEditingName(false)
      return
    }
    setNameLoading(true)
    setNameError('')
    try {
      const res = await userApi.updateProfile({ displayName: displayName.trim() })
      updateUser({ displayName: res.data.displayName })
      setEditingName(false)
    } catch (err: unknown) {
      setNameError(err instanceof Error ? err.message : 'Error al actualizar')
    } finally {
      setNameLoading(false)
    }
  }

  // ─── Handler contraseña ────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordError('')
    setPasswordSuccess(false)
    try {
      await userApi.updateProfile({ currentPassword, newPassword })
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setTimeout(() => { setShowPasswordForm(false); setPasswordSuccess(false) }, 1500)
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Error al cambiar contraseña')
    } finally {
      setPasswordLoading(false)
    }
  }

  // ─── Handler switch carrera ────────────────────────────────────────────────
  const handleSwitchCareer = async (profileId: string) => {
    setSwitchingId(profileId)
    try {
      await progressApi.switchCareer(profileId)
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['progress'] })
    } catch (err) {
      console.error(err)
    } finally {
      setSwitchingId(null)
    }
  }

  const handleLogout = () => {
    queryClient.clear()
    logout()
    router.replace('/login')
  }

  const initials = user?.displayName
    ?.split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() ?? '?'

  return (
    <div className="max-w-lg mx-auto px-4 py-6">

      {/* Avatar + nombre */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
             style={{ background: 'var(--accent)', color: '#0b0d12', fontFamily: 'var(--font-syne)' }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                className="flex-1 px-3 py-1.5 rounded-xl text-sm font-semibold border outline-none"
                style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--accent)' }}
              />
              <button onClick={handleSaveName} disabled={nameLoading}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40"
                      style={{ background: 'var(--accent)', color: '#0b0d12' }}>
                {nameLoading ? '...' : 'Guardar'}
              </button>
            </div>
          ) : (
            <button onClick={() => { setDisplayName(user?.displayName ?? ''); setEditingName(true) }}
                    className="text-left group">
              <p className="font-bold text-lg leading-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-syne)' }}>
                {user?.displayName}
                <span className="ml-2 text-xs opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--muted)' }}>editar</span>
              </p>
            </button>
          )}
          {nameError && <p className="text-xs mt-1" style={{ color: 'var(--error, #f87171)' }}>{nameError}</p>}
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{user?.email}</p>
        </div>
      </div>

      {/* Cambiar contraseña */}
      <div className="p-4 rounded-2xl mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
        <button onClick={() => { setShowPasswordForm(!showPasswordForm); setPasswordError(''); setPasswordSuccess(false) }}
                className="flex items-center justify-between w-full">
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>Cambiar contraseña</span>
          <ChevronRight size={16}
                        className={`transition-transform ${showPasswordForm ? 'rotate-90' : ''}`}
                        style={{ color: 'var(--muted)' }} />
        </button>

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="mt-4 flex flex-col gap-3">
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                placeholder="Contraseña actual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none pr-10"
                style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--pt-border)' }}
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--muted)' }}>
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                placeholder="Nueva contraseña (mín. 6 caracteres)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none pr-10"
                style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--pt-border)' }}
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--muted)' }}>
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {passwordError && <p className="text-xs" style={{ color: 'var(--error, #f87171)' }}>{passwordError}</p>}
            {passwordSuccess && <p className="text-xs" style={{ color: 'var(--accent)' }}>¡Contraseña actualizada!</p>}
            <button type="submit" disabled={passwordLoading}
                    className="py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                    style={{ background: 'var(--accent)', color: '#0b0d12' }}>
              {passwordLoading ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </form>
        )}
      </div>

      {/* Mis carreras */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
            Mis carreras
          </h2>
          <button onClick={() => router.push('/onboarding?mode=add')}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl"
                  style={{ background: 'var(--surface2)', color: 'var(--accent)' }}>
            <Plus size={13} />
            Agregar
          </button>
        </div>

        {profilesLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 rounded-full animate-spin"
                 style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : profiles.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>
            No tienes carreras agregadas.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {profiles.map((profile) => (
              <div key={profile.id}
                   className="p-4 rounded-2xl"
                   style={{
                     background: profile.isActive ? 'rgba(110,231,183,0.08)' : 'var(--surface)',
                     border: `1px solid ${profile.isActive ? 'var(--accent)' : 'var(--pt-border)'}`,
                   }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background: profile.isActive ? 'var(--accent)' : 'var(--surface2)' }}>
                    {profile.career.university.logoUrl
                      ? <img src={profile.career.university.logoUrl}
                             alt={profile.career.university.shortName}
                             className="w-7 h-7 object-contain rounded" />
                      : <Building2 size={18} style={{ color: profile.isActive ? '#0b0d12' : 'var(--muted)' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                        {profile.career.name}
                      </p>
                      {profile.isActive && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                              style={{ background: 'var(--accent)', color: '#0b0d12' }}>
                          Activa
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {profile.career.university.shortName} · C{profile.currentSemester}
                    </p>
                  </div>
                  {!profile.isActive && (
                    <button
                      onClick={() => handleSwitchCareer(profile.id)}
                      disabled={switchingId === profile.id}
                      className="text-xs px-3 py-1.5 rounded-xl font-medium flex-shrink-0 disabled:opacity-40"
                      style={{ background: 'var(--surface2)', color: 'var(--text)' }}>
                      {switchingId === profile.id ? '...' : 'Activar'}
                    </button>
                  )}
                  {profile.isActive && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                         style={{ background: 'var(--accent)' }}>
                      <Check size={14} style={{ color: '#0b0d12' }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cerrar sesión */}
      {confirmLogout ? (
        <div className="p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
            ¿Seguro que quieres cerrar sesión?
          </p>
          <div className="flex gap-2">
            <button onClick={handleLogout}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
              Sí, cerrar sesión
            </button>
            <button onClick={() => setConfirmLogout(false)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setConfirmLogout(true)}
                className="flex items-center gap-2 w-full py-3 px-4 rounded-2xl text-sm font-medium"
                style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--muted)' }}>
          <LogOut size={16} />
          Cerrar sesión
        </button>
      )}
    </div>
  )
}
