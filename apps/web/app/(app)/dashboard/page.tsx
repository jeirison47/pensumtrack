'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useProgress } from '@/hooks/useProgress'
import { progressApi } from '@/services/api'
import { useProgressStore } from '@/store/useProgressStore'
import { BookOpen, CheckCircle, Clock, Star } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { profile, isLoading, getSubjectStatus, invalidateProgress } = useProgress()
  const { updateSubjectLocally } = useProgressStore()

  useEffect(() => {
    if (!isLoading && profile === null) router.replace('/onboarding')
  }, [isLoading, profile, router])

  if (isLoading || profile === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
             style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const allSubjects = profile.career.subjects
  const passed     = profile.subjects.filter((s) => s.status === 'PASSED').length
  const inProgress = profile.subjects.filter((s) => s.status === 'IN_PROGRESS').length
  const presel     = profile.preselection?.subjects.length ?? 0
  const available  = allSubjects.filter((s) => getSubjectStatus(s.code) === 'available').length
  const earnedCredits = allSubjects
    .filter((s) => profile.subjects.find((ss) => ss.subjectCode === s.code && ss.status === 'PASSED'))
    .reduce((sum, s) => sum + s.credits, 0)
  const totalCredits = profile.career.totalCredits
  const pct = Math.round((earnedCredits / totalCredits) * 100)

  const inProgressSubjects = allSubjects.filter((s) =>
    profile.subjects.find((ss) => ss.subjectCode === s.code && ss.status === 'IN_PROGRESS')
  )

  const handleMarkPassed = async (code: string) => {
    updateSubjectLocally(code, 'PASSED')
    await progressApi.updateSubject(code, 'PASSED')
    invalidateProgress()
  }

  const stats = [
    { label: 'Créditos aprobados', value: `${earnedCredits}/${totalCredits}`, icon: Star, color: 'var(--accent)' },
    { label: 'Materias aprobadas', value: passed,      icon: CheckCircle, color: 'var(--accent)' },
    { label: 'En curso',           value: inProgress,  icon: Clock,       color: 'var(--warn)' },
    { label: 'Disponibles',        value: available,   icon: BookOpen,    color: 'var(--accent2)' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
          Hola, {user?.displayName?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          {profile.career.name} · {profile.career.university?.shortName ?? ''}
        </p>
      </div>

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

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
            <Icon size={18} style={{ color }} className="mb-2" />
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>{value}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{label}</p>
          </div>
        ))}
      </div>

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
              <div key={s.code} className="flex items-center justify-between p-3 rounded-xl"
                   style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{s.name}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{s.code} · {s.credits} créditos</p>
                </div>
                <button onClick={() => handleMarkPassed(s.code)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={{ background: 'rgba(110,231,183,0.15)', color: 'var(--accent)' }}>
                  Aprobar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
