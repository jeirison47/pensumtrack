'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Lock, Clock, Star, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { usePlan } from '@/hooks/usePlan'
import { PlanGateModal } from '@/components/ui/PlanGateModal'
import type { Subject, SubjectStatus } from '@pensumtrack/types'
import type { SubjectStatusDB, ClassSchedule } from '@/services/api'

const DAY_OPTIONS: { value: string; label: string }[] = [
  { value: 'MON', label: 'L' }, { value: 'TUE', label: 'M' }, { value: 'WED', label: 'X' },
  { value: 'THU', label: 'J' }, { value: 'FRI', label: 'V' }, { value: 'SAT', label: 'S' }, { value: 'SUN', label: 'D' },
]

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

// Acciones disponibles según el estado actual
const STATUS_ACTIONS: Partial<Record<SubjectStatus, { label: string; next: SubjectStatusDB; style: 'primary' | 'warn' | 'danger' | 'ghost' }[]>> = {
  available: [
    { label: 'Marcar en curso',  next: 'IN_PROGRESS', style: 'warn' },
    { label: 'Marcar aprobada',  next: 'PASSED',      style: 'primary' },
  ],
  pending: [
    { label: 'Marcar en curso',  next: 'IN_PROGRESS', style: 'warn' },
    { label: 'Marcar aprobada',  next: 'PASSED',      style: 'primary' },
  ],
  'in-progress': [
    { label: 'Marcar aprobada',  next: 'PASSED',      style: 'primary' },
    { label: 'Marcar reprobada', next: 'FAILED',      style: 'danger' },
    { label: 'Quitar estado',    next: 'PENDING',      style: 'ghost' },
  ],
  passed: [
    { label: 'Quitar aprobación', next: 'PENDING',     style: 'ghost' },
  ],
  failed: [
    { label: 'Volver a cursar',  next: 'IN_PROGRESS', style: 'warn' },
    { label: 'Quitar estado',    next: 'PENDING',      style: 'ghost' },
  ],
  locked: [],
  preselected: [],
}

const ACTION_STYLES = {
  primary: { background: 'var(--accent)',                    color: '#0b0d12' },
  warn:    { background: 'rgba(251,191,36,0.15)',            color: 'var(--warn)',   border: '1px solid var(--warn)' },
  danger:  { background: 'rgba(248,113,113,0.15)',           color: 'var(--danger)', border: '1px solid var(--danger)' },
  ghost:   { background: 'var(--surface2)',                  color: 'var(--muted)',  border: '1px solid var(--pt-border)' },
}

interface Props {
  subject: Subject | null
  status: SubjectStatus
  allSubjects: Subject[]
  getSubjectStatus: (code: string) => SubjectStatus
  preselectedCodes: string[]
  onClose: () => void
  onChangeStatus?: (code: string, next: SubjectStatusDB, grade?: number, schedule?: ClassSchedule) => Promise<void>
  gradeOf?: (code: string) => number | null
  scheduleOf?: (code: string) => ClassSchedule | null
  onTogglePreselection?: (code: string) => void
  universityId?: string
}

export function SubjectModal({
  subject, status, allSubjects, getSubjectStatus,
  preselectedCodes, onClose, onChangeStatus, onTogglePreselection, gradeOf, scheduleOf, universityId,
}: Props) {
  const [gradeInput, setGradeInput] = useState('')
  const [awaitingGrade, setAwaitingGrade] = useState(false)
  const [gateOpen, setGateOpen] = useState(false)
  const { hasFeature } = usePlan()

  // Horario de clase (al marcar en curso o editar)
  const [schedMode, setSchedMode] = useState(false)
  const [schedDays, setSchedDays] = useState<string[]>([])
  const [schedStart, setSchedStart] = useState('')
  const [schedEnd, setSchedEnd] = useState('')
  const [profId, setProfId] = useState<string | null>(null)
  const [profName, setProfName] = useState('')
  const [profList, setProfList] = useState<{ id: string; name: string }[]>([])
  const [profOpen, setProfOpen] = useState(false)

  useEffect(() => {
    setGradeInput('')
    setAwaitingGrade(false)
    setSchedMode(false)
  }, [subject?.code])

  // Cargar profesores (de la universidad) la primera vez que se abre el horario
  useEffect(() => {
    if (schedMode && profList.length === 0) {
      const url = universityId ? `/api/professors?universityId=${universityId}` : '/api/professors'
      fetch(url).then((r) => r.json()).then((j) => setProfList((j.data ?? []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })))).catch(() => {})
    }
  }, [schedMode, universityId, profList.length])

  function openSchedule() {
    const cur = scheduleOf?.(subject!.code)
    setSchedDays(cur?.classDays ?? [])
    setSchedStart(cur?.classStart ?? '')
    setSchedEnd(cur?.classEnd ?? '')
    setProfId(cur?.professorId ?? null)
    setProfName(cur?.professorName ?? '')
    setProfOpen(false)
    setSchedMode(true)
  }

  function confirmSchedule() {
    const schedule: ClassSchedule = {
      classDays: schedDays,
      classStart: schedStart || null,
      classEnd: schedEnd || null,
      professorId: profId,
      professorName: profName.trim() || null,
    }
    onChangeStatus?.(subject!.code, 'IN_PROGRESS', undefined, schedule)
    onClose()
  }

  if (!subject) return null

  const color = STATUS_COLORS[status]
  const currentGrade = gradeOf?.(subject.code)

  // Relaciones
  const isPrereqOf  = allSubjects.filter((s) => s.prerequisites.includes(subject.code))
  const isCoReqOf   = allSubjects.filter((s) => s.corequisites.includes(subject.code))
  const isPreselected = preselectedCodes.includes(subject.code)
  const canPreselect  = status === 'available' || status === 'preselected'
  const actions       = STATUS_ACTIONS[status] ?? []

  const RelationRow = ({ code }: { code: string }) => {
    const s = allSubjects.find((sub) => sub.code === code)
    const st = getSubjectStatus(code)
    const met = st === 'passed' || st === 'in-progress'
    return (
      <div className="flex items-center justify-between p-2.5 rounded-lg"
           style={{ background: 'var(--surface2)' }}>
        <div>
          <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{code}</span>
          <p className="text-sm" style={{ color: 'var(--text)' }}>{s?.name ?? code}</p>
        </div>
        {met
          ? <CheckCircle size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          : <XCircle    size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
        }
      </div>
    )
  }

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
          <h2 className="text-lg font-bold leading-tight"
              style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
            {subject.name}
          </h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg flex-shrink-0"
                style={{ color: 'var(--muted)', background: 'var(--surface2)' }}>
          <X size={16} />
        </button>
      </div>

      {/* Info básica */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Cuatrimestre', value: `C${subject.semester}` },
          { label: 'Créditos',     value: subject.credits },
          { label: 'Área',         value: subject.area ?? '—' },
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
          <p className="text-xs font-semibold mb-2 tracking-wider" style={{ color: 'var(--muted)' }}>
            PRERREQUISITOS ({subject.prerequisites.length})
          </p>
          <div className="flex flex-col gap-2">
            {subject.prerequisites.map((code) => <RelationRow key={code} code={code} />)}
          </div>
        </div>
      )}

      {/* Correquisitos */}
      {subject.corequisites.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2 tracking-wider" style={{ color: 'var(--muted)' }}>
            CORREQUISITOS — se toman simultáneamente
          </p>
          <div className="flex flex-col gap-2">
            {subject.corequisites.map((code) => <RelationRow key={code} code={code} />)}
          </div>
        </div>
      )}

      {/* Es prerrequisito de */}
      {isPrereqOf.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2 tracking-wider" style={{ color: 'var(--muted)' }}>
            ES PRERREQUISITO DE
          </p>
          <div className="flex flex-wrap gap-2">
            {isPrereqOf.map((s) => {
              const st = getSubjectStatus(s.code)
              const c = STATUS_COLORS[st]
              return (
                <span key={s.code} className="text-xs px-2 py-1 rounded-full"
                      style={{ background: `${c}15`, color: c, border: `1px solid ${c}40` }}>
                  {s.code} · {s.name}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Es correquisito de */}
      {isCoReqOf.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2 tracking-wider" style={{ color: 'var(--muted)' }}>
            ES CORREQUISITO DE
          </p>
          <div className="flex flex-wrap gap-2">
            {isCoReqOf.map((s) => (
              <span key={s.code} className="text-xs px-2 py-1 rounded-full"
                    style={{ background: 'var(--surface2)', color: 'var(--accent2)' }}>
                {s.code} · {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Nota actual (si está aprobada y tiene nota) */}
      {status === 'passed' && currentGrade != null && (
        <div className="flex items-center gap-3 p-3 rounded-xl"
             style={{ background: 'var(--surface2)' }}>
          <Star size={15} style={{ color: 'var(--accent)' }} />
          <span className="text-sm" style={{ color: 'var(--muted)' }}>Nota registrada:</span>
          <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{currentGrade}</span>
        </div>
      )}

      {/* Horario de clase de la materia en curso (solo lectura) */}
      {status === 'in-progress' && !schedMode && (() => {
        const sc = scheduleOf?.(subject.code)
        const hasInfo = sc && (sc.classDays.length > 0 || sc.classStart || sc.professorId || sc.professorName)
        if (!hasInfo) return null
        const prof = sc!.professorName
        return (
          <div className="p-3 rounded-xl space-y-1" style={{ background: 'var(--surface2)' }}>
            <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--muted)' }}>HORARIO DE CLASE</p>
            {sc!.classDays.length > 0 && (
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                {sc!.classDays.map((d) => DAY_OPTIONS.find((o) => o.value === d)?.label ?? d).join(', ')}
                {sc!.classStart && ` · ${sc!.classStart}${sc!.classEnd ? `–${sc!.classEnd}` : ''}`}
              </p>
            )}
            {prof && <p className="text-sm" style={{ color: 'var(--text)' }}>Prof. {prof}</p>}
          </div>
        )
      })()}

      {/* Formulario de horario al marcar en curso */}
      {schedMode && onChangeStatus && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--muted)' }}>HORARIO DE CLASE (opcional)</p>
          <div className="flex gap-1.5">
            {DAY_OPTIONS.map((d) => {
              const on = schedDays.includes(d.value)
              return (
                <button key={d.value} type="button" onClick={() => setSchedDays((p) => on ? p.filter((x) => x !== d.value) : [...p, d.value])}
                        className="flex-1 py-2 rounded-lg text-sm font-semibold cursor-pointer"
                        style={{ background: on ? 'var(--accent)' : 'var(--surface2)', color: on ? '#0b0d12' : 'var(--muted)', border: `1px solid ${on ? 'var(--accent)' : 'var(--pt-border)'}` }}>
                  {d.label}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <input type="time" value={schedStart} onChange={(e) => setSchedStart(e.target.value)}
                   className="flex-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'var(--surface2)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>a</span>
            <input type="time" value={schedEnd} onChange={(e) => setSchedEnd(e.target.value)}
                   className="flex-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'var(--surface2)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
          </div>
          <div className="relative">
            <input value={profName} onChange={(e) => { setProfName(e.target.value); setProfId(null); setProfOpen(true) }} onFocus={() => setProfOpen(true)}
                   placeholder="Profesor (busca o escribe)" className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'var(--surface2)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
            {profOpen && profName.trim() && (
              <div className="absolute z-10 left-0 right-0 mt-1 rounded-xl overflow-hidden max-h-44 overflow-y-auto" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
                {profList.filter((p) => p.name.toLowerCase().includes(profName.toLowerCase())).slice(0, 8).map((p) => (
                  <button key={p.id} type="button" onClick={() => { setProfId(p.id); setProfName(p.name); setProfOpen(false) }}
                          className="block w-full text-left px-3 py-2 text-sm hover:opacity-80" style={{ color: 'var(--text)' }}>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={confirmSchedule} className="flex-1 py-3 rounded-xl font-semibold text-sm" style={ACTION_STYLES.warn}>Marcar en curso</button>
            <button onClick={() => setSchedMode(false)} className="flex-1 py-3 rounded-xl font-semibold text-sm" style={ACTION_STYLES.ghost}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Editar horario (materia en curso) */}
      {status === 'in-progress' && !schedMode && !awaitingGrade && onChangeStatus && (
        <button onClick={() => { if (!hasFeature('subject_status_update')) { setGateOpen(true); return } openSchedule() }}
                className="w-full py-2.5 rounded-xl font-semibold text-sm" style={ACTION_STYLES.ghost}>
          {scheduleOf?.(subject.code)?.classDays.length ? 'Editar horario' : 'Agregar horario'}
        </button>
      )}

      {/* Acciones de estado */}
      {actions.length > 0 && onChangeStatus && !schedMode && (
        <div className="flex flex-col gap-2">
          {awaitingGrade ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                Nota obtenida (opcional, 0–100)
              </p>
              <input
                type="number"
                min={0} max={100} step={0.01}
                value={gradeInput}
                onChange={e => setGradeInput(e.target.value)}
                placeholder="Ej: 85"
                autoFocus
                className="w-full rounded-xl px-4 py-3 text-sm outline-none font-mono"
                style={{ background: 'var(--surface2)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const grade = gradeInput ? Math.min(100, Math.max(0, Number(gradeInput))) : undefined
                    onChangeStatus(subject.code, 'PASSED', grade)
                    onClose()
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm"
                  style={ACTION_STYLES.primary}>
                  Confirmar
                </button>
                <button
                  onClick={() => { setAwaitingGrade(false); setGradeInput('') }}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm"
                  style={ACTION_STYLES.ghost}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            actions.map((action) => (
              <button key={action.next}
                      onClick={() => {
                        if (!hasFeature('subject_status_update')) { setGateOpen(true); return }
                        if (action.next === 'PASSED') {
                          setGradeInput('')
                          setAwaitingGrade(true)
                        } else if (action.next === 'IN_PROGRESS') {
                          openSchedule()
                        } else {
                          onChangeStatus(subject.code, action.next)
                          onClose()
                        }
                      }}
                      className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity"
                      style={ACTION_STYLES[action.style]}>
                {action.label}
              </button>
            ))
          )}
        </div>
      )}

      {/* Acción preselección */}
      {canPreselect && onTogglePreselection && (
        <button onClick={() => onTogglePreselection(subject.code)}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity"
                style={{
                  background: isPreselected ? 'rgba(167,139,250,0.15)' : 'rgba(167,139,250,0.3)',
                  color: 'var(--purple)',
                  border: '1px solid var(--purple)',
                }}>
          {isPreselected ? 'Quitar de preselección' : 'Agregar a preselección'}
        </button>
      )}
    </div>
  )

  return (
    <>
      <Modal open={!!subject} onClose={onClose} maxWidth="max-w-md">
        <div className="overflow-y-auto max-h-[80dvh]">
          {content}
        </div>
      </Modal>
      <PlanGateModal open={gateOpen} featureLabel="Marcar materias"
                     onClose={() => setGateOpen(false)} />
    </>
  )
}
