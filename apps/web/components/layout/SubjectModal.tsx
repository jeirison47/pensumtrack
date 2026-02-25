'use client'

import { useEffect } from 'react'
import { X, CheckCircle, XCircle, Lock, Clock, Star } from 'lucide-react'
import type { Subject, SubjectStatus } from '@pensumtrack/types'

const STATUS_COLORS: Record<SubjectStatus, string> = {
  passed:        'var(--accent)',
  'in-progress': 'var(--warn)',
  available:     'var(--accent2)',
  preselected:   'var(--purple)',
  locked:        'var(--muted)',
  pending:       'var(--muted)',
  failed:        'var(--danger)',
}

const STATUS_LABELS: Record<SubjectStatus, string> = {
  passed:        'Aprobada',
  'in-progress': 'En curso',
  available:     'Disponible',
  preselected:   'Preseleccionada',
  locked:        'Bloqueada',
  pending:       'Pendiente',
  failed:        'Reprobada',
}

const STATUS_ICONS: Record<SubjectStatus, React.ReactNode> = {
  passed:        <CheckCircle size={14} />,
  'in-progress': <Clock size={14} />,
  available:     <Star size={14} />,
  preselected:   <Star size={14} />,
  locked:        <Lock size={14} />,
  pending:       <Lock size={14} />,
  failed:        <XCircle size={14} />,
}

interface Props {
  subject: Subject | null
  status: SubjectStatus
  allSubjects: Subject[]
  getSubjectStatus: (code: string) => SubjectStatus
  preselectedCodes: string[]
  onClose: () => void
  onTogglePreselection?: (code: string) => void
}

export function SubjectModal({ subject, status, allSubjects, getSubjectStatus, preselectedCodes, onClose, onTogglePreselection }: Props) {
  useEffect(() => {
    if (!subject) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [subject, onClose])

  if (!subject) return null

  const color = STATUS_COLORS[status]
  const unlockedBy = allSubjects.filter((s) => s.prerequisites.includes(subject.code))
  const isPreselected = preselectedCodes.includes(subject.code)
  const canPreselect = status === 'available' || status === 'preselected'

  const content = (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
              {subject.code}
            </span>
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: `${color}20`, color }}>
              {STATUS_ICONS[status]}
              {STATUS_LABELS[status]}
            </span>
          </div>
          <h2 className="text-lg font-bold leading-tight" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
            {subject.name}
          </h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg flex-shrink-0"
                style={{ color: 'var(--muted)', background: 'var(--surface2)' }}>
          <X size={16} />
        </button>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Cuatrimestre', value: `C${subject.semester}` },
          { label: 'Créditos', value: subject.credits },
          { label: 'Área', value: subject.area ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="p-3 rounded-xl" style={{ background: 'var(--surface2)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Prerrequisitos */}
      {subject.prerequisites.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2 tracking-wider" style={{ color: 'var(--muted)' }}>PRERREQUISITOS</p>
          <div className="flex flex-col gap-2">
            {subject.prerequisites.map((code) => {
              const prereq = allSubjects.find((s) => s.code === code)
              const prereqStatus = getSubjectStatus(code)
              const met = prereqStatus === 'passed' || prereqStatus === 'in-progress'
              return (
                <div key={code} className="flex items-center justify-between p-2.5 rounded-lg"
                     style={{ background: 'var(--surface2)' }}>
                  <div>
                    <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{code}</span>
                    <p className="text-sm" style={{ color: 'var(--text)' }}>{prereq?.name ?? code}</p>
                  </div>
                  {met
                    ? <CheckCircle size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    : <XCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                  }
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Desbloquea */}
      {unlockedBy.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2 tracking-wider" style={{ color: 'var(--muted)' }}>DESBLOQUEA</p>
          <div className="flex flex-wrap gap-2">
            {unlockedBy.map((s) => (
              <span key={s.code} className="text-xs px-2 py-1 rounded-full"
                    style={{ background: 'var(--surface2)', color: 'var(--accent2)' }}>
                {s.code} · {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Acción preselección */}
      {canPreselect && onTogglePreselection && (
        <button onClick={() => onTogglePreselection(subject.code)}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity"
                style={{
                  background: isPreselected ? 'rgba(167,139,250,0.15)' : 'var(--accent)',
                  color: isPreselected ? 'var(--purple)' : '#0b0d12',
                  border: isPreselected ? '1px solid var(--purple)' : 'none',
                }}>
          {isPreselected ? 'Quitar de preselección' : 'Agregar a preselección'}
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Mobile: bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden rounded-t-3xl p-6 max-h-[85dvh] overflow-y-auto"
           style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--pt-border)' }} />
        {content}
      </div>

      {/* Desktop: modal centrado */}
      <div className="fixed inset-0 z-50 hidden md:flex items-center justify-center p-6 pointer-events-none">
        <div className="w-full max-w-md rounded-2xl p-6 pointer-events-auto overflow-y-auto max-h-[90dvh]"
             style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
          {content}
        </div>
      </div>
    </>
  )
}
