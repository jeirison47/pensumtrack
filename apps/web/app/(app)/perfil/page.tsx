'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { progressApi, userApi } from '@/services/api'
import { useAuthStore } from '@/store/useAuthStore'
import { GraduationCap, Building2, Check, Plus, LogOut, ChevronRight, Eye, EyeOff, BookMarked, CreditCard, X, Lock, Home } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePlan } from '@/hooks/usePlan'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { PlanGateModal } from '@/components/ui/PlanGateModal'
import { Modal } from '@/components/ui/Modal'
import { FEATURE_LABELS } from '@/lib/features'
import type { FeatureKey } from '@/lib/features'

export default function PerfilPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, updateUser, logout } = useAuthStore()
  const { hasFeature } = usePlan()
  const { toDOP, updatedAt } = useExchangeRate()

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
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofMethod, setProofMethod] = useState<'transfer' | 'paypal'>('transfer')
  const [confirmMethod, setConfirmMethod] = useState<'app' | 'email'>('app')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

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
                        <div className="text-right">
                          <p className="text-base font-bold" style={{ color: 'var(--text)' }}>
                            ${plan.price}<span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>/mes</span>
                          </p>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>
                            RD${toDOP(plan.price)}/mes
                          </p>
                        </div>
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
                      onClick={() => { setSelectedPlanName(plan.name); setSelectedPlanId(plan.id); setProofFile(null); setSubmitSuccess(false); setProofMethod('transfer'); setConfirmMethod('app'); setShowUpgradeModal(true) }}
                      className="w-full py-2 rounded-xl text-sm font-semibold cursor-pointer"
                      style={{ background: 'var(--accent)', color: '#0b0d12' }}>
                      Solicitar este plan
                    </button>
                  )}
                </div>
              )
            })}
            {updatedAt && (
              <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
                Tasa de cambio actualizada: {new Date(updatedAt).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        )}
      </div>

      <button onClick={() => router.push('/solicitar')}
              className="flex items-center gap-2 w-full py-3 px-4 rounded-2xl text-sm font-medium mb-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--muted)' }}>
        <BookMarked size={16} />
        Solicitar agregar carrera o pensum
      </button>

      {/* Ir a la landing */}
      <button onClick={() => router.push('/landing')}
              className="flex items-center gap-2 w-full py-3 px-4 rounded-2xl text-sm font-medium mb-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--muted)' }}>
        <Home size={16} />
        Ir a la página principal
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
             onClick={() => { if (!submitting) setShowUpgradeModal(false) }}>
          <div className="w-full max-w-md rounded-2xl p-5 space-y-4 max-h-[90dvh] overflow-y-auto"
               style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}
               onClick={(e) => e.stopPropagation()}>

            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-base" style={{ color: 'var(--text)' }}>
                  Solicitar plan {selectedPlanName}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  Realiza el pago y sube el comprobante para activar tu plan.
                </p>
              </div>
              <button onClick={() => setShowUpgradeModal(false)} disabled={submitting}
                      className="p-1 cursor-pointer hover:opacity-70 flex-shrink-0 ml-3"
                      style={{ color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-6 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                     style={{ background: 'rgba(16,185,129,0.12)' }}>✓</div>
                <p className="font-semibold" style={{ color: 'var(--text)' }}>¡Solicitud enviada!</p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Revisaremos tu comprobante y activaremos el plan en menos de 24 horas. Te notificaremos por correo.
                </p>
                <button onClick={() => setShowUpgradeModal(false)}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer mt-2"
                        style={{ background: 'var(--accent)', color: '#0b0d12' }}>
                  Entendido
                </button>
              </div>
            ) : (
              <>
                {/* Método de pago */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>¿Cómo vas a pagar?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([['transfer', 'Transferencia bancaria'], ['paypal', 'PayPal / Tarjeta']] as const).map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setProofMethod(val)}
                              className="py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                              style={{
                                background: proofMethod === val ? 'rgba(16,185,129,0.1)' : 'var(--surface2)',
                                border: `1px solid ${proofMethod === val ? 'var(--accent)' : 'var(--pt-border)'}`,
                                color: proofMethod === val ? 'var(--accent)' : 'var(--muted)',
                              }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Método de confirmación */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>¿Cómo vas a enviar el comprobante?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ['app', '📎 Subirlo aquí en la app'],
                      ['email', '📧 Por correo o WhatsApp'],
                    ] as const).map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setConfirmMethod(val)}
                              className="py-2.5 px-3 rounded-xl text-xs font-medium cursor-pointer text-left"
                              style={{
                                background: confirmMethod === val ? 'rgba(16,185,129,0.1)' : 'var(--surface2)',
                                border: `1px solid ${confirmMethod === val ? 'var(--accent)' : 'var(--pt-border)'}`,
                                color: confirmMethod === val ? 'var(--accent)' : 'var(--muted)',
                              }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {confirmMethod === 'email' && (
                    <div className="p-3 rounded-xl text-xs space-y-1"
                         style={{ background: 'var(--surface2)', border: '1px solid var(--pt-border)' }}>
                      <p style={{ color: 'var(--text)' }}>Envía el comprobante a:</p>
                      <p>📧 <span style={{ color: 'var(--accent)' }}>pensumtrackapp@gmail.com</span></p>
                      <p>💬 WhatsApp: <span style={{ color: 'var(--accent)' }}>809-980-9245</span></p>
                      <p className="pt-1" style={{ color: 'var(--muted)' }}>
                        Incluye tu usuario <strong style={{ color: 'var(--text)' }}>{user?.username ?? user?.email}</strong> y el plan <strong style={{ color: 'var(--text)' }}>{selectedPlanName}</strong> en el mensaje.
                      </p>
                    </div>
                  )}
                </div>

                {/* Datos según método */}
                {proofMethod === 'transfer' ? (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Cuentas disponibles</p>
                    {[
                      { bank: 'Banreservas', account: '9602214062', color: '#10b981' },
                      { bank: 'Banco Popular', account: '849096342', color: '#38bdf8' },
                      { bank: 'QIK (BHD)', account: '1000162805', color: '#a78bfa' },
                    ].map(({ bank, account, color }) => (
                      <div key={bank} className="flex items-center justify-between p-3 rounded-xl"
                           style={{ background: 'var(--surface2)', border: '1px solid var(--pt-border)' }}>
                        <div>
                          <p className="text-sm font-semibold" style={{ color }}>{bank}</p>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>Ahorro · Jeirison Volquez</p>
                        </div>
                        <p className="text-sm font-mono font-bold" style={{ color: 'var(--text)' }}>{account}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <a href={`https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=jeirison46%40gmail.com&item_name=PensumTrack+Plan+${encodeURIComponent(selectedPlanName)}&currency_code=USD&no_shipping=1`}
                       target="_blank" rel="noopener noreferrer"
                       className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold cursor-pointer"
                       style={{ background: '#0070ba', color: '#fff' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.243-8.143 6.243H10.28c-.176 0-.33.127-.358.303L8.763 21.26l-.373 2.37a.38.38 0 0 0 .377.435h3.593c.458 0 .85-.334.922-.785l.038-.196.734-4.653.047-.257a.935.935 0 0 1 .922-.786h.58c3.762 0 6.705-1.528 7.566-5.948.36-1.845.174-3.386-.727-4.523z"/>
                      </svg>
                      Ir a PayPal
                    </a>
                    <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
                      Luego de pagar, toma un screenshot de la confirmación y súbelo abajo.
                    </p>
                  </div>
                )}

                {/* Subida de comprobante — solo si elige subir en la app */}
                {confirmMethod === 'app' && <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                    Comprobante de pago <span style={{ color: 'var(--muted)', fontWeight: 'normal' }}>(opcional)</span>
                  </p>
                  <label className="flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer border-2 border-dashed transition-colors hover:opacity-80"
                         style={{ borderColor: proofFile ? 'var(--accent)' : 'var(--pt-border)', background: proofFile ? 'rgba(16,185,129,0.06)' : 'var(--surface2)' }}>
                    <input type="file" accept="image/*,.pdf" className="hidden"
                           onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} />
                    {proofFile ? (
                      <>
                        <Check size={20} style={{ color: 'var(--accent)' }} />
                        <p className="text-sm font-medium text-center" style={{ color: 'var(--accent)' }}>{proofFile.name}</p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Toca para cambiar</p>
                      </>
                    ) : (
                      <>
                        <CreditCard size={20} style={{ color: 'var(--muted)' }} />
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>Toca para subir imagen o PDF</p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Máx. 5 MB</p>
                      </>
                    )}
                  </label>
                </div>}

                <button
                  disabled={submitting}
                  onClick={async () => {
                    if (!selectedPlanId) return
                    setSubmitting(true)
                    try {
                      const token = localStorage.getItem('token')
                      const fd = new FormData()
                      fd.append('planId', selectedPlanId)
                      fd.append('method', proofMethod)
                      fd.append('confirmMethod', confirmMethod)
                      if (proofFile) fd.append('proof', proofFile)
                      const res = await fetch('/api/plan-upgrade-requests', {
                        method: 'POST',
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                        body: fd,
                      })
                      const json = await res.json()
                      if (!res.ok) throw new Error(json.error)
                      setSubmitSuccess(true)
                    } catch (err: unknown) {
                      toast.error(err instanceof Error ? err.message : 'Error al enviar')
                    } finally {
                      setSubmitting(false)
                    }
                  }}
                  className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-40 cursor-pointer"
                  style={{ background: 'var(--accent)', color: '#0b0d12' }}>
                  {submitting ? 'Enviando...' : confirmMethod === 'app' ? 'Enviar solicitud con comprobante' : 'Registrar solicitud'}
                </button>

                <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
                  Si prefieres, puedes enviar el comprobante por correo o WhatsApp. Tu solicitud quedará registrada de igual forma.
                </p>
                <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
                  Confirmaremos la activación en menos de 24 horas.
                </p>
              </>
            )}
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
