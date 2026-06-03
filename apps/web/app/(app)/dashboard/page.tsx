'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useProgress } from '@/hooks/useProgress'
import { progressApi } from '@/services/api'
import { useProgressStore } from '@/store/useProgressStore'
import { BookOpen, CheckCircle, Clock, Star, TrendingUp, GraduationCap, Plus } from 'lucide-react'
import Link from 'next/link'
import { usePlan } from '@/hooks/usePlan'
import { PlanGateModal } from '@/components/ui/PlanGateModal'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { profile, isLoading, getSubjectStatus, invalidateProgress, allSubjects } = useProgress()
  const { updateSubjectLocally } = useProgressStore()
  const { hasFeature } = usePlan()
  const [approvingCode, setApprovingCode] = useState<string | null>(null)
  const [gradeInput, setGradeInput] = useState('')
  const [gateModal, setGateModal] = useState<{ open: boolean; label?: string }>({ open: false })

  useEffect(() => {
    if (user?.isAdmin) router.replace('/admin')
  }, [router, user])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
             style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (profile === null) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
             style={{ background: 'rgba(16,185,129,0.1)' }}>
          <GraduationCap size={32} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
            Hola, {user?.displayName?.split(' ')[0]}
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Aún no tienes una carrera configurada. Selecciona tu universidad y carrera para comenzar a hacer seguimiento de tu progreso.
          </p>
        </div>
        <div className="w-full flex flex-col gap-3">
          <Link href="/onboarding"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-semibold text-sm cursor-pointer"
                style={{ background: 'var(--accent)', color: '#0b0d12' }}>
            <GraduationCap size={16} />
            Seleccionar universidad y carrera
          </Link>
          <Link href="/solicitar"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-medium cursor-pointer"
                style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}>
            <Plus size={16} style={{ color: 'var(--accent)' }} />
            Mi universidad no está — solicitar que la agreguen
          </Link>
        </div>
      </div>
    )
  }

  const passed     = profile.subjects.filter((s) => s.status === 'PASSED').length
  const inProgress = profile.subjects.filter((s) => s.status === 'IN_PROGRESS').length
  const presel     = profile.preselections.reduce((sum, p) => sum + p.subjects.length, 0)
  const available  = allSubjects.filter((s) => getSubjectStatus(s.code) === 'available').length
  const earnedCredits = allSubjects
    .filter((s) => profile.subjects.find((ss) => ss.subjectCode === s.code && ss.status === 'PASSED'))
    .reduce((sum, s) => sum + s.credits, 0)
  const totalCredits = profile.pensum?.totalCredits ?? profile.career.totalCredits ?? allSubjects.reduce((s, sub) => s + sub.credits, 0)
  const pct = Math.round((earnedCredits / totalCredits) * 100)

  const inProgressSubjects = allSubjects.filter((s) =>
    profile.subjects.find((ss) => ss.subjectCode === s.code && ss.status === 'IN_PROGRESS')
  )

  const handleMarkPassed = async (code: string, grade?: number) => {
    updateSubjectLocally(code, 'PASSED', grade)
    await progressApi.updateSubject(code, 'PASSED', grade)
    invalidateProgress()
    setApprovingCode(null)
    setGradeInput('')
  }

  // Promedio ponderado e índice
  const gradeEntries = allSubjects.flatMap(s => {
    const rec = profile.subjects.find(ss => ss.subjectCode === s.code && ss.status === 'PASSED' && ss.grade != null)
    return rec ? [{ credits: s.credits, grade: rec.grade! }] : []
  })
  const totalGradeCredits = gradeEntries.reduce((sum, e) => sum + e.credits, 0)
  const promedio = totalGradeCredits > 0
    ? Math.round((gradeEntries.reduce((sum, e) => sum + e.grade * e.credits, 0) / totalGradeCredits) * 100) / 100
    : null
  const indice = promedio != null ? Math.round((promedio * 4 / 100) * 100) / 100 : null

  const pending = allSubjects.length - passed - inProgress

  const stats = [
    { label: 'Materias aprobadas', value: passed,    icon: CheckCircle, color: 'var(--accent)' },
    { label: 'Materias pendientes', value: pending,   icon: BookOpen,    color: 'var(--accent2)' },
    { label: 'Materias en curso',   value: inProgress, icon: Clock,      color: 'var(--warn)' },
    { label: 'Materias disponibles', value: available, icon: Star,      color: 'var(--muted)' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
          Hola, {user?.displayName?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          {profile.career.name}{profile.career.university?.shortName ? ` · ${profile.career.university.shortName}` : ''}{(profile.pensum?.year ?? profile.career.year) ? ` · ${profile.pensum?.year ?? profile.career.year}` : ''}
        </p>
      </div>

      {/* Stats grid */}
      {hasFeature('dashboard_stats') ? (
        <>
          {/* Progreso general */}
          <div className="p-4 rounded-2xl mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>Progreso de la carrera</span>
              <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{pct}%</span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: 'var(--surface2)' }}>
              <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{earnedCredits} de {totalCredits} créditos completados</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
                <Icon size={18} style={{ color }} className="mb-2" />
                <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>{value}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{label}</p>
              </div>
            ))}
          </div>
          {promedio != null && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
                <TrendingUp size={18} style={{ color: 'var(--purple)' }} className="mb-2" />
                <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>{promedio.toFixed(2)}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Promedio (0–100)</p>
              </div>
              <div className="p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
                <TrendingUp size={18} style={{ color: 'var(--accent2)' }} className="mb-2" />
                <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>{indice!.toFixed(2)}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Índice estimado (0–4.0)</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <button onClick={() => setGateModal({ open: true, label: 'Estadísticas de progreso' })}
                className="w-full p-4 rounded-2xl mb-4 flex items-center justify-between cursor-pointer hover:opacity-80"
                style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
          <div className="flex items-center gap-3">
            <TrendingUp size={18} style={{ color: 'var(--muted)' }} />
            <span className="text-sm" style={{ color: 'var(--muted)' }}>Ver estadísticas, promedios e índice</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>Premium</span>
        </button>
      )}

      {/* Preselección rápida */}
      {presel > 0 && (
        <div className="p-4 rounded-2xl mb-4 flex items-center justify-between"
             style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid var(--purple)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--purple)' }}>Preselección activa</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{presel} materia{presel !== 1 ? 's' : ''} seleccionada{presel !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => router.push('/preseleccion')}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: 'var(--purple)', color: '#fff' }}>
            Ver
          </button>
        </div>
      )}

      {/* Materias en curso */}
      {inProgressSubjects.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--muted)' }}>EN CURSO ESTE PERÍODO</h2>
          <div className="flex flex-col gap-2">
            {inProgressSubjects.map((s) => (
              <div key={s.code} className="flex flex-col gap-2 p-3 rounded-xl"
                   style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{s.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{s.code} · {s.credits} créditos</p>
                  </div>
                  {approvingCode !== s.code && (
                    <button onClick={() => { if (!hasFeature('subject_status_update')) { setGateModal({ open: true, label: 'Marcar materias' }); return } setApprovingCode(s.code); setGradeInput('') }}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium"
                            style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent)' }}>
                      Aprobar
                    </button>
                  )}
                </div>
                {approvingCode === s.code && (
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min={0} max={100} step={0.01}
                      value={gradeInput}
                      onChange={e => setGradeInput(e.target.value)}
                      placeholder="Nota (opcional)"
                      autoFocus
                      className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none font-mono"
                      style={{ background: 'var(--surface2)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
                    />
                    <button
                      onClick={() => {
                        const g = gradeInput ? Math.min(100, Math.max(0, Number(gradeInput))) : undefined
                        handleMarkPassed(s.code, g)
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'var(--accent)', color: '#0b0d12' }}>
                      OK
                    </button>
                    <button
                      onClick={() => setApprovingCode(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--pt-border)' }}>
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <PlanGateModal open={gateModal.open} featureLabel={gateModal.label}
                     onClose={() => setGateModal({ open: false })} />
    </div>
  )
}
