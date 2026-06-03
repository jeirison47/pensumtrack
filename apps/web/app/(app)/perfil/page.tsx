'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { progressApi, userApi } from '@/services/api'
import { useAuthStore } from '@/store/useAuthStore'
import { GraduationCap, Building2, Check, Plus, LogOut, ChevronRight, Eye, EyeOff, BookMarked, CreditCard, X, Lock } from 'lucide-react'
import { usePlan } from '@/hooks/usePlan'
import { PlanGateModal } from '@/components/ui/PlanGateModal'
import { Modal } from '@/components/ui/Modal'
import { FEATURE_LABELS } from '@/lib/features'
import type { FeatureKey } from '@/lib/features'

export default function PerfilPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, updateUser, logout } = useAuthStore()
  const { hasFeature } = usePlan()

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
  const [confirmSwitchId, setConfirmSwitchId] = useState<string | null>(null)

  // ─── Planes ────────────────────────────────────────────────────────────────
  const [showPlans, setShowPlans] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedPlanName, setSelectedPlanName] = useState('')

  const { data: plansData } = useQuery({
    queryKey: ['plans-public'],
    queryFn: () => fetch('/api/plans').then((r) => r.json()),
  })
  const allPlans: { id: string; name: string; description: string | null; price: number | null; isDefault: boolean; features: { featureKey: string }[] }[] = plansData?.data ?? []

  // ─── Logout ────────────────────────────────────────────────────────────────
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [careerGateOpen, setCareerGateOpen] = useState(false)

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
  const handleSwitchCareer = async () => {
    if (!confirmSwitchId) return
    setSwitchingId(confirmSwitchId)
    setConfirmSwitchId(null)
    try {
      await progressApi.switchCareer(confirmSwitchId)
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
          <button onClick={() => { if (!hasFeature('multiple_careers')) { setCareerGateOpen(true); return } router.push('/onboarding?mode=add') }}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl"
                  style={{ background: 'var(--surface2)', color: 'var(--accent)' }}>
            {hasFeature('multiple_careers') ? <Plus size={13} /> : <Lock size={13} />}
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
                      onClick={() => setConfirmSwitchId(profile.id)}
                      disabled={switchingId === profile.id}
                      className="text-xs px-3 py-1.5 rounded-xl font-medium flex-shrink-0 disabled:opacity-40"
                      style={{ background: 'var(--surface2)', color: 'var(--text)' }}>
                      {switchingId === profile.id ? '...' : 'Seleccionar'}
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

      {/* Mi plan */}
      <div className="mb-6">
        <button onClick={() => setShowPlans((v) => !v)}
                className="flex items-center justify-between w-full p-4 rounded-2xl cursor-pointer"
                style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
          <div className="flex items-center gap-3">
            <CreditCard size={18} style={{ color: 'var(--accent)' }} />
            <div className="text-left">
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Mi plan</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {user?.planName ?? 'Sin plan asignado'}
              </p>
            </div>
          </div>
          <ChevronRight size={16}
                        className={`transition-transform ${showPlans ? 'rotate-90' : ''}`}
                        style={{ color: 'var(--muted)' }} />
        </button>

        {showPlans && allPlans.length > 0 && (
          <div className="mt-3 space-y-3">
            {allPlans.map((plan) => {
              const isCurrent = plan.name === user?.planName
              return (
                <div key={plan.id} className="p-4 rounded-2xl space-y-3"
                     style={{
                       background: isCurrent ? 'rgba(16,185,129,0.06)' : 'var(--surface)',
                       border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--pt-border)'}`,
                     }}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{plan.name}</p>
                        {isCurrent && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent)' }}>
                            Tu plan actual
                          </span>
                        )}
                      </div>
                      {plan.description && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{plan.description}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {plan.price != null ? (
                        <p className="text-base font-bold" style={{ color: 'var(--text)' }}>
                          ${plan.price}<span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>/mes</span>
                        </p>
                      ) : (
                        <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>Gratis</p>
                      )}
                    </div>
                  </div>

                  {plan.features.length > 0 ? (
                    <div className="space-y-1">
                      {plan.features.map((f) => {
                        const label = FEATURE_LABELS[f.featureKey as FeatureKey]
                        return (
                          <div key={f.featureKey} className="flex items-center gap-2 text-xs"
                               style={{ color: 'var(--muted)' }}>
                            <Check size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                            {label?.label ?? f.featureKey}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Acceso básico — ver pensum y mapa</p>
                  )}

                  {!isCurrent && (
                    <button
                      onClick={() => { setSelectedPlanName(plan.name); setShowUpgradeModal(true) }}
                      className="w-full py-2 rounded-xl text-sm font-semibold cursor-pointer"
                      style={{ background: 'var(--accent)', color: '#0b0d12' }}>
                      Solicitar este plan
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <button onClick={() => router.push('/solicitar')}
              className="flex items-center gap-2 w-full py-3 px-4 rounded-2xl text-sm font-medium mb-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--muted)' }}>
        <BookMarked size={16} />
        Solicitar agregar carrera o pensum
      </button>

      {/* Cerrar sesión */}
      <button onClick={() => setConfirmLogout(true)}
              className="flex items-center gap-2 w-full py-3 px-4 rounded-2xl text-sm font-medium"
              style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--muted)' }}>
        <LogOut size={16} />
        Cerrar sesión
      </button>

      {/* Modal solicitar cambio de plan */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)' }}
             onClick={() => setShowUpgradeModal(false)}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4"
               style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                   style={{ background: 'rgba(16,185,129,0.1)' }}>
                <CreditCard size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <button onClick={() => setShowUpgradeModal(false)} className="p-1 cursor-pointer hover:opacity-70"
                      style={{ color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>
            <div>
              <p className="font-bold" style={{ color: 'var(--text)' }}>
                Solicitar plan {selectedPlanName}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                Para activar este plan, realiza el pago mediante transferencia bancaria y envíanos el comprobante.
              </p>
            </div>
            <div className="p-3 rounded-xl space-y-1.5 text-sm"
                 style={{ background: 'var(--surface2)', border: '1px solid var(--pt-border)' }}>
              <p className="font-medium text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>
                Datos de pago
              </p>
              <p style={{ color: 'var(--text)' }}>📧 Email: <span style={{ color: 'var(--accent)' }}>pagos@pensumtrack.app</span></p>
              <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                Incluye tu nombre de usuario y el plan que deseas al enviar el comprobante. Te confirmaremos la activación en menos de 24 horas.
              </p>
            </div>
            <button onClick={() => setShowUpgradeModal(false)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{ background: 'var(--accent)', color: '#0b0d12' }}>
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal confirmación cambio de carrera */}
      <Modal open={!!confirmSwitchId} onClose={() => setConfirmSwitchId(null)}>
        {(() => {
          const p = profiles.find((x) => x.id === confirmSwitchId)
          return (
            <>
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl mx-auto mb-4"
                   style={{ background: 'rgba(110,231,183,0.12)' }}>
                <GraduationCap size={22} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="text-base font-bold text-center mb-1"
                  style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
                Cambiar carrera activa
              </h3>
              <p className="text-sm text-center mb-6" style={{ color: 'var(--muted)' }}>
                ¿Deseas seleccionar{' '}
                <span className="font-semibold" style={{ color: 'var(--text)' }}>{p?.career.name}</span>{' '}
                como tu carrera activa?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmSwitchId(null)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
                  Cancelar
                </button>
                <button onClick={handleSwitchCareer}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: 'var(--accent)', color: '#0b0d12' }}>
                  Seleccionar
                </button>
              </div>
            </>
          )
        })()}
      </Modal>

      {/* Modal confirmación logout */}
      <Modal open={confirmLogout} onClose={() => setConfirmLogout(false)}>
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl mx-auto mb-4"
             style={{ background: 'rgba(248,113,113,0.12)' }}>
          <LogOut size={22} style={{ color: '#f87171' }} />
        </div>
        <h3 className="text-base font-bold text-center mb-1"
            style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
          Cerrar sesión
        </h3>
        <p className="text-sm text-center mb-6" style={{ color: 'var(--muted)' }}>
          ¿Seguro que quieres salir de tu cuenta?
        </p>
        <div className="flex gap-3">
          <button onClick={() => setConfirmLogout(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
            Cancelar
          </button>
          <button onClick={handleLogout}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
            Sí, cerrar sesión
          </button>
        </div>
      </Modal>

      <PlanGateModal open={careerGateOpen} featureLabel="Múltiples carreras"
                     onClose={() => setCareerGateOpen(false)} />
    </div>
  )
}
