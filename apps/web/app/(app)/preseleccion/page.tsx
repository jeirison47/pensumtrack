'use client'

import { useState, useMemo } from 'react'
import { useProgress } from '@/hooks/useProgress'
import { useProgressStore } from '@/store/useProgressStore'
import { progressApi } from '@/services/api'
import { validatePreselection } from '@pensumtrack/utils'
import { SubjectModal } from '@/components/layout/SubjectModal'
import type { Subject, SubjectStatus } from '@pensumtrack/types'
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

const PERIODS = [
  'Ene–Abr 2025', 'May–Ago 2025', 'Sep–Dic 2025',
  'Ene–Abr 2026', 'May–Ago 2026', 'Sep–Dic 2026',
]

export default function PreseleccionPage() {
  const { profile, isLoading, getSubjectStatus, preselectedCodes, invalidateProgress } = useProgress()
  const { updatePreselectionLocally } = useProgressStore()
  const [period, setPeriod] = useState(PERIODS[3]) // default: período más próximo
  const [showSummary, setShowSummary] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Subject | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<SubjectStatus>('available')

  const allSubjects = profile?.career.subjects ?? []

  // Materias del periodo actualmente seleccionado
  const currentPeriodCodes = profile?.preselections.find((p) => p.period === period)?.subjects ?? []

  const availableSubjects = useMemo(() =>
    allSubjects.filter((s) => {
      const st = getSubjectStatus(s.code)
      return st === 'available' || st === 'preselected'
    }),
  [allSubjects, getSubjectStatus])

  const warnings = useMemo(() =>
    validatePreselection(currentPeriodCodes, allSubjects),
  [currentPeriodCodes, allSubjects])

  const totalCredits = allSubjects
    .filter((s) => currentPeriodCodes.includes(s.code))
    .reduce((sum, s) => sum + s.credits, 0)

  const handleToggle = async (code: string) => {
    const next = currentPeriodCodes.includes(code)
      ? currentPeriodCodes.filter((c) => c !== code)
      : [...currentPeriodCodes, code]
    updatePreselectionLocally(period, next)
    await progressApi.updatePreselection(period, next)
    invalidateProgress()
  }

  const handleConfirm = async () => {
    setSaving(true)
    try {
      await progressApi.updatePreselection(period, currentPeriodCodes)
      invalidateProgress()
    } finally {
      setSaving(false)
    }
  }

  const openModal = (s: Subject) => {
    setSelected(s)
    setSelectedStatus(getSubjectStatus(s.code))
  }

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
           style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  )

  const Summary = () => (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between text-sm">
        <span style={{ color: 'var(--muted)' }}>Materias</span>
        <span className="font-bold" style={{ color: 'var(--text)' }}>{currentPeriodCodes.length} / 5</span>
      </div>
      <div className="flex justify-between text-sm">
        <span style={{ color: 'var(--muted)' }}>Créditos</span>
        <span className="font-bold" style={{ color: 'var(--text)' }}>{totalCredits} / 20</span>
      </div>

      {warnings.map((w) => (
        <div key={w.type} className="flex items-start gap-2 p-3 rounded-xl text-xs"
             style={{ background: 'rgba(251,191,36,0.1)', color: 'var(--warn)' }}>
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          {w.message}
        </div>
      ))}

      {currentPeriodCodes.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {allSubjects.filter((s) => currentPeriodCodes.includes(s.code)).map((s) => (
            <div key={s.code} className="flex items-center justify-between text-xs p-2 rounded-lg"
                 style={{ background: 'var(--surface2)' }}>
              <span style={{ color: 'var(--text)' }}>{s.name}</span>
              <span style={{ color: 'var(--muted)' }}>{s.credits} cr.</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={handleConfirm} disabled={saving || currentPeriodCodes.length === 0}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: 'var(--accent)', color: '#0b0d12' }}>
        <CheckCircle size={16} />
        {saving ? 'Guardando...' : 'Confirmar preselección'}
      </button>
    </div>
  )

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-6 md:flex md:gap-6">
        {/* Main content */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
            Preselección
          </h1>
          <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
            Selecciona las materias que planeas tomar en cada período.
          </p>

          {/* Selector de período */}
          <div className="mb-5">
            <label className="text-xs font-semibold mb-2 block tracking-wider" style={{ color: 'var(--muted)' }}>
              PERÍODO
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {PERIODS.map((p) => {
                const hasPresel = (profile?.preselections.find((pr) => pr.period === p)?.subjects.length ?? 0) > 0
                return (
                  <button key={p} onClick={() => setPeriod(p)}
                          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all relative"
                          style={{
                            background: period === p ? 'var(--accent2)' : 'var(--surface)',
                            color: period === p ? '#0b0d12' : 'var(--muted)',
                            border: `1px solid ${period === p ? 'var(--accent2)' : 'var(--pt-border)'}`,
                          }}>
                    {p}
                    {hasPresel && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                            style={{ background: 'var(--accent)' }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Lista de materias disponibles */}
          <div className="flex flex-col gap-2">
            {availableSubjects.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: 'var(--muted)' }}>
                No tienes materias disponibles para preseleccionar.
              </p>
            ) : (
              availableSubjects.map((s) => {
                const isSelected = currentPeriodCodes.includes(s.code)
                const prereqsMet = s.prerequisites.every((code) => {
                  const st = getSubjectStatus(code)
                  return st === 'passed' || st === 'in-progress'
                })
                return (
                  <div key={s.code} className="flex items-center gap-3 p-3 rounded-xl transition-all"
                       style={{
                         background: isSelected ? 'rgba(167,139,250,0.1)' : 'var(--surface)',
                         border: `1px solid ${isSelected ? 'var(--purple)' : 'var(--pt-border)'}`,
                       }}>
                    <button onClick={() => handleToggle(s.code)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                            style={{
                              background: isSelected ? 'var(--purple)' : 'var(--surface2)',
                              border: `1px solid ${isSelected ? 'var(--purple)' : 'var(--pt-border)'}`,
                            }}>
                      {isSelected && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                    </button>

                    <button className="flex-1 text-left" onClick={() => openModal(s)}>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{s.name}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {s.code} · {s.credits} créditos
                      </p>
                    </button>

                    <span className="flex-shrink-0">
                      {prereqsMet
                        ? <CheckCircle size={16} style={{ color: 'var(--accent)' }} />
                        : <AlertTriangle size={16} style={{ color: 'var(--warn)' }} />
                      }
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden md:block w-72 flex-shrink-0">
          <div className="sticky top-24 p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
            <h3 className="font-bold text-sm mb-4" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
              Resumen — {period}
            </h3>
            <Summary />
          </div>
        </aside>
      </div>

      {/* Mobile: barra sticky + bottom sheet */}
      <div className="fixed bottom-16 left-0 right-0 z-40 md:hidden px-4 pb-2">
        <button onClick={() => setShowSummary(!showSummary)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {currentPeriodCodes.length} materia{currentPeriodCodes.length !== 1 ? 's' : ''} · {totalCredits} cr. · {period}
            </span>
            {warnings.length > 0 && <AlertTriangle size={14} style={{ color: 'var(--warn)' }} />}
          </div>
          {showSummary ? <ChevronDown size={16} style={{ color: 'var(--muted)' }} /> : <ChevronUp size={16} style={{ color: 'var(--muted)' }} />}
        </button>

        {showSummary && (
          <div className="mt-1 p-4 rounded-2xl"
               style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
            <Summary />
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      <SubjectModal
        subject={selected}
        status={selectedStatus}
        allSubjects={allSubjects}
        getSubjectStatus={getSubjectStatus}
        preselectedCodes={preselectedCodes}
        onClose={() => setSelected(null)}
        onTogglePreselection={handleToggle}
      />
    </>
  )
}
