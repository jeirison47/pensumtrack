'use client'

import { useState, useMemo } from 'react'
import { useProgress } from '@/hooks/useProgress'
import { useProgressStore } from '@/store/useProgressStore'
import { progressApi } from '@/services/api'
import type { PreselectionDB } from '@/services/api'
import { validatePreselection } from '@pensumtrack/utils'
import { SubjectModal } from '@/components/layout/SubjectModal'
import { Modal } from '@/components/ui/Modal'
import type { Subject, SubjectStatus } from '@pensumtrack/types'
import {
  AlertTriangle, CheckCircle, Plus, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  passed:        { bg: 'rgba(110,231,183,0.15)', border: '#6ee7b7', text: '#6ee7b7' },
  'in-progress': { bg: 'rgba(251,191,36,0.15)',  border: '#fbbf24', text: '#fbbf24' },
  available:     { bg: 'rgba(56,189,248,0.15)',   border: '#38bdf8', text: '#38bdf8' },
  preselected:   { bg: 'rgba(167,139,250,0.15)',  border: '#a78bfa', text: '#a78bfa' },
  locked:        { bg: 'rgba(75,85,99,0.15)',     border: '#4b5563', text: '#6b7280' },
  failed:        { bg: 'rgba(248,113,113,0.15)',  border: '#f87171', text: '#f87171' },
}

function statusBadge(status: PreselectionDB['status']) {
  if (status === 'OPEN')      return { label: 'Abierto',    bg: 'rgba(110,231,183,0.12)',  color: 'var(--accent)' }
  if (status === 'CONFIRMED') return { label: 'Confirmado', bg: 'rgba(167,139,250,0.12)',  color: 'var(--purple)' }
  return                             { label: 'Cerrado',    bg: 'rgba(100,116,139,0.12)',  color: 'var(--muted)' }
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function PreseleccionPage() {
  const { profile, isLoading, getSubjectStatus, invalidateProgress } = useProgress()
  const {
    updatePreselectionSubjectsLocally,
    addPreselectionLocally,
    removePreselectionLocally,
    updatePreselectionStatusLocally,
    updateSubjectLocally,
  } = useProgressStore()

  // Tab activo
  const preselections: PreselectionDB[] = profile?.preselections ?? []
  const activePreselection = preselections.find((p) => p.status === 'OPEN' || p.status === 'CONFIRMED')
  const defaultTab = activePreselection?.id ?? preselections[preselections.length - 1]?.id ?? null
  const [activeTabId, setActiveTabId] = useState<string | null>(null)

  const currentId = activeTabId ?? defaultTab
  const current = preselections.find((p) => p.id === currentId) ?? null

  // Crear período
  const [showCreate, setShowCreate] = useState(false)
  const [createLabel, setCreateLabel] = useState('')
  const [createStart, setCreateStart] = useState('')
  const [createEnd, setCreateEnd] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Eliminar período
  const [deleteTarget, setDeleteTarget] = useState<PreselectionDB | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Confirmar preselección
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState('')

  // Cerrar período
  const [showClosePanel, setShowClosePanel] = useState(false)
  const [closeResults, setCloseResults] = useState<Record<string, { status: 'PASSED' | 'FAILED'; grade: string }>>({})
  const [closing, setClosing] = useState(false)
  const [closeError, setCloseError] = useState('')

  // Resumen mobile
  const [showSummary, setShowSummary] = useState(false)

  // Modal materia
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<SubjectStatus>('available')

  // ─── Datos derivados ───────────────────────────────────────────────────────

  const allSubjects = profile?.career.subjects ?? []
  const hasActive = preselections.some((p) => p.status === 'OPEN' || p.status === 'CONFIRMED')

  const availableSubjects = useMemo(() =>
    allSubjects.filter((s) => {
      const st = getSubjectStatus(s.code)
      return st === 'available' || st === 'preselected'
    }),
  [allSubjects, getSubjectStatus])

  const currentSubjectCodes = current?.subjects ?? []

  const warnings = useMemo(() =>
    current?.status === 'OPEN' ? validatePreselection(currentSubjectCodes, allSubjects) : [],
  [current, currentSubjectCodes, allSubjects])

  const totalCredits = allSubjects
    .filter((s) => currentSubjectCodes.includes(s.code))
    .reduce((sum, s) => sum + s.credits, 0)

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleToggle = async (code: string) => {
    if (!current || current.status !== 'OPEN') return
    const next = currentSubjectCodes.includes(code)
      ? currentSubjectCodes.filter((c) => c !== code)
      : [...currentSubjectCodes, code]
    updatePreselectionSubjectsLocally(current.id, next)
    await progressApi.updatePeriodSubjects(current.id, next)
    invalidateProgress()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      const startISO = new Date(createStart + '-01').toISOString()
      const endISO   = new Date(createEnd   + '-01').toISOString()
      const res = await progressApi.createPeriod(createLabel.trim(), startISO, endISO)
      addPreselectionLocally(res.data)
      setActiveTabId(res.data.id)
      setShowCreate(false)
      setCreateLabel('')
      setCreateStart('')
      setCreateEnd('')
      invalidateProgress()
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Error al crear período')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const revertSubjects = deleteTarget.status === 'CONFIRMED' ? deleteTarget.subjects : []
      await progressApi.deletePeriod(deleteTarget.id)
      removePreselectionLocally(deleteTarget.id, revertSubjects)
      if (activeTabId === deleteTarget.id) setActiveTabId(null)
      setDeleteTarget(null)
      invalidateProgress()
    } catch {
      // silencioso
    } finally {
      setDeleting(false)
    }
  }

  const handleConfirm = async () => {
    if (!current) return
    setConfirming(true)
    setConfirmError('')
    try {
      await progressApi.confirmPeriod(current.id)
      updatePreselectionStatusLocally(current.id, 'CONFIRMED')
      current.subjects.forEach((code) => updateSubjectLocally(code, 'IN_PROGRESS'))
      setShowConfirmModal(false)
      invalidateProgress()
    } catch (err: unknown) {
      setConfirmError(err instanceof Error ? err.message : 'Error al confirmar')
    } finally {
      setConfirming(false)
    }
  }

  const handleOpenClose = () => {
    if (!current) return
    const init: Record<string, { status: 'PASSED' | 'FAILED'; grade: string }> = {}
    current.subjects.forEach((code) => { init[code] = { status: 'PASSED', grade: '' } })
    setCloseResults(init)
    setCloseError('')
    setShowClosePanel(true)
  }

  const handleClose = async () => {
    if (!current) return
    setClosing(true)
    setCloseError('')
    try {
      const results = current.subjects.map((code) => ({
        subjectCode: code,
        status: closeResults[code]?.status ?? 'PASSED',
        grade: closeResults[code]?.grade ? parseFloat(closeResults[code].grade) : undefined,
      }))
      await progressApi.closePeriod(current.id, results)
      updatePreselectionStatusLocally(current.id, 'CLOSED')
      results.forEach(({ subjectCode, status }) => updateSubjectLocally(subjectCode, status))
      setShowClosePanel(false)
      invalidateProgress()
    } catch (err: unknown) {
      setCloseError(err instanceof Error ? err.message : 'Error al cerrar período')
    } finally {
      setClosing(false)
    }
  }

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 rounded-full animate-spin"
           style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  )

  // ─── Resumen (sidebar / bottom sheet) ─────────────────────────────────────

  const SummaryContent = () => (
    <div className="flex flex-col gap-4">
      {current?.status === 'OPEN' && (
        <>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--muted)' }}>Materias</span>
            <span className="font-bold" style={{ color: 'var(--text)' }}>{currentSubjectCodes.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--muted)' }}>Créditos</span>
            <span className="font-bold" style={{ color: 'var(--text)' }}>{totalCredits}</span>
          </div>
          {warnings.map((w) => (
            <div key={w.type} className="flex items-start gap-2 p-3 rounded-xl text-xs"
                 style={{ background: 'rgba(251,191,36,0.1)', color: 'var(--warn)' }}>
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              {w.message}
            </div>
          ))}
          {currentSubjectCodes.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {allSubjects.filter((s) => currentSubjectCodes.includes(s.code)).map((s) => (
                <div key={s.code} className="flex items-center justify-between text-xs p-2 rounded-lg"
                     style={{ background: 'var(--surface2)' }}>
                  <span style={{ color: 'var(--text)' }}>{s.name}</span>
                  <span style={{ color: 'var(--muted)' }}>{s.credits} cr.</span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => { setShowConfirmModal(true); setConfirmError('') }}
            disabled={currentSubjectCodes.length === 0}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: 'var(--accent)', color: '#0b0d12' }}>
            <CheckCircle size={16} />
            Confirmar preselección
          </button>
        </>
      )}
    </div>
  )

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
              Preselección
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
              Gestiona tus períodos académicos.
            </p>
          </div>
          <button
            onClick={() => { setShowCreate(true); setCreateError('') }}
            disabled={hasActive}
            title={hasActive ? 'Cierra el período activo antes de crear uno nuevo' : 'Agregar período'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent)', color: '#0b0d12' }}>
            <Plus size={15} />
            Nuevo período
          </button>
        </div>

        {preselections.length === 0 ? (
          /* Estado vacío */
          <div className="flex flex-col items-center justify-center py-20 gap-4"
               style={{ color: 'var(--muted)' }}>
            <p className="text-sm text-center">No tienes períodos de preselección aún.</p>
            <button
              onClick={() => { setShowCreate(true); setCreateError('') }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}>
              <Plus size={15} />
              Agregar primer período
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
              {preselections.map((p) => {
                const badge = statusBadge(p.status)
                const isActive = p.id === currentId
                return (
                  <button
                    key={p.id}
                    onClick={() => setActiveTabId(p.id)}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: isActive ? 'var(--surface)' : 'transparent',
                      border: `1px solid ${isActive ? 'var(--accent)' : 'var(--pt-border)'}`,
                      color: isActive ? 'var(--text)' : 'var(--muted)',
                    }}>
                    {p.label}
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {current && (
              <div className="md:flex md:gap-6">
                {/* Contenido principal */}
                <div className="flex-1">
                  {/* Info del período + botón eliminar */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {new Date(current.startDate).toLocaleDateString('es', { month: 'long', year: 'numeric' })}
                        {' – '}
                        {new Date(current.endDate).toLocaleDateString('es', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => setDeleteTarget(current)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                      <Trash2 size={13} />
                      Eliminar
                    </button>
                  </div>

                  {/* OPEN: lista editable */}
                  {current.status === 'OPEN' && (
                    <div className="flex flex-col gap-2">
                      {availableSubjects.length === 0 ? (
                        <p className="text-sm py-8 text-center" style={{ color: 'var(--muted)' }}>
                          No tienes materias disponibles para preseleccionar.
                        </p>
                      ) : (
                        availableSubjects.map((s) => {
                          const isSelected = currentSubjectCodes.includes(s.code)
                          const prereqsMet = s.prerequisites.every((code) => {
                            const st = getSubjectStatus(code)
                            return st === 'passed' || st === 'in-progress'
                          })
                          const colors = STATUS_COLORS[isSelected ? 'preselected' : 'available']
                          return (
                            <div key={s.code}
                                 className="flex items-center gap-3 p-3 rounded-xl transition-all"
                                 style={{
                                   background: colors.bg,
                                   border: `1px solid ${colors.border}`,
                                 }}>
                              <button onClick={() => handleToggle(s.code)}
                                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                                      style={{
                                        background: isSelected ? colors.border : 'var(--surface2)',
                                        border: `1px solid ${isSelected ? colors.border : 'var(--pt-border)'}`,
                                      }}>
                                {isSelected && <span style={{ color: '#0b0d12', fontSize: 12 }}>✓</span>}
                              </button>
                              <button className="flex-1 text-left" onClick={() => { setSelectedSubject(s); setSelectedStatus(getSubjectStatus(s.code)) }}>
                                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{s.name}</p>
                                <p className="text-xs" style={{ color: 'var(--muted)' }}>{s.code} · {s.credits} créditos</p>
                              </button>
                              <span className="flex-shrink-0">
                                {prereqsMet
                                  ? <CheckCircle size={16} style={{ color: '#6ee7b7' }} />
                                  : <AlertTriangle size={16} style={{ color: 'var(--warn)' }} />}
                              </span>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}

                  {/* CONFIRMED: solo lectura */}
                  {current.status === 'CONFIRMED' && (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-2">
                        {current.subjects.length === 0 ? (
                          <p className="text-sm py-8 text-center" style={{ color: 'var(--muted)' }}>Sin materias.</p>
                        ) : (
                          current.subjects.map((code) => {
                            const s = allSubjects.find((x) => x.code === code)
                            const c = STATUS_COLORS['in-progress']
                            return (
                              <div key={code} className="flex items-center gap-3 p-3 rounded-xl"
                                   style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                                     style={{ background: c.border }}>
                                  <span style={{ color: '#0b0d12', fontSize: 12 }}>✓</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{s?.name ?? code}</p>
                                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{code} · {s?.credits ?? '?'} créditos</p>
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                      style={{ background: `${c.border}20`, color: c.text }}>
                                  En curso
                                </span>
                              </div>
                            )
                          })
                        )}
                      </div>
                      <button
                        onClick={handleOpenClose}
                        className="mt-2 py-3 rounded-xl font-semibold text-sm"
                        style={{ background: 'var(--accent)', color: '#0b0d12' }}>
                        Cerrar período y registrar resultados
                      </button>
                    </div>
                  )}

                  {/* CLOSED: historial */}
                  {current.status === 'CLOSED' && (
                    <div className="flex flex-col gap-2">
                      {current.subjects.length === 0 ? (
                        <p className="text-sm py-8 text-center" style={{ color: 'var(--muted)' }}>Sin materias.</p>
                      ) : (
                        current.subjects.map((code) => {
                          const s = allSubjects.find((x) => x.code === code)
                          const studentSubject = profile?.subjects.find((x) => x.subjectCode === code)
                          const passed = studentSubject?.status === 'PASSED'
                          const c = passed ? STATUS_COLORS.passed : STATUS_COLORS.failed
                          return (
                            <div key={code} className="flex items-center gap-3 p-3 rounded-xl"
                                 style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{s?.name ?? code}</p>
                                <p className="text-xs" style={{ color: 'var(--muted)' }}>{code} · {s?.credits ?? '?'} créditos</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {studentSubject?.grade != null && (
                                  <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
                                    {studentSubject.grade.toFixed(1)}
                                  </span>
                                )}
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                      style={{ background: `${c.border}20`, color: c.text }}>
                                  {passed ? 'Aprobada' : 'Reprobada'}
                                </span>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Sidebar OPEN (desktop) */}
                {current.status === 'OPEN' && (
                  <aside className="hidden md:block w-72 flex-shrink-0">
                    <div className="sticky top-24 p-4 rounded-2xl"
                         style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
                      <h3 className="font-bold text-sm mb-4"
                          style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
                        Resumen — {current.label}
                      </h3>
                      <SummaryContent />
                    </div>
                  </aside>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile: barra sticky resumen (solo OPEN) */}
      {current?.status === 'OPEN' && (
        <div className="fixed bottom-16 left-0 right-0 z-40 md:hidden px-4 pb-2">
          <button onClick={() => setShowSummary(!showSummary)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl"
                  style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {currentSubjectCodes.length} materia{currentSubjectCodes.length !== 1 ? 's' : ''} · {totalCredits} cr.
              </span>
              {warnings.length > 0 && <AlertTriangle size={14} style={{ color: 'var(--warn)' }} />}
            </div>
            {showSummary
              ? <ChevronDown size={16} style={{ color: 'var(--muted)' }} />
              : <ChevronUp size={16} style={{ color: 'var(--muted)' }} />}
          </button>
          {showSummary && (
            <div className="mt-1 p-4 rounded-2xl"
                 style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
              <SummaryContent />
            </div>
          )}
        </div>
      )}

      {/* Modal: crear período */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo período">
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>
              Nombre del período
            </label>
            <input
              autoFocus
              placeholder="Ej. Ene–Jun 2026"
              value={createLabel}
              onChange={(e) => setCreateLabel(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
              style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--pt-border)' }}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>
              Inicio (mes/año)
            </label>
            <input
              type="month"
              value={createStart}
              onChange={(e) => setCreateStart(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
              style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--pt-border)' }}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>
              Fin (mes/año)
            </label>
            <input
              type="month"
              value={createEnd}
              onChange={(e) => setCreateEnd(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
              style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--pt-border)' }}
            />
          </div>
          {createError && <p className="text-xs" style={{ color: '#f87171' }}>{createError}</p>}
          <button type="submit" disabled={creating}
                  className="py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                  style={{ background: 'var(--accent)', color: '#0b0d12' }}>
            {creating ? 'Creando...' : 'Crear período'}
          </button>
        </form>
      </Modal>

      {/* Modal: confirmar preselección */}
      <Modal open={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <h3 className="font-bold text-base mb-2 text-center"
            style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
          Confirmar preselección
        </h3>
        <p className="text-sm text-center mb-2" style={{ color: 'var(--muted)' }}>
          Las materias seleccionadas pasarán a estado <strong>En curso</strong>.
          Esta acción no se puede deshacer fácilmente.
        </p>
        <p className="text-sm text-center font-semibold mb-6" style={{ color: 'var(--text)' }}>
          {currentSubjectCodes.length} materia{currentSubjectCodes.length !== 1 ? 's' : ''} · {totalCredits} créditos
        </p>
        {confirmError && <p className="text-xs mb-3 text-center" style={{ color: '#f87171' }}>{confirmError}</p>}
        <div className="flex gap-3">
          <button onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={confirming}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                  style={{ background: 'var(--accent)', color: '#0b0d12' }}>
            {confirming ? 'Confirmando...' : 'Confirmar'}
          </button>
        </div>
      </Modal>

      {/* Modal: eliminar período */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <h3 className="font-bold text-base mb-2 text-center"
            style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
          Eliminar período
        </h3>
        <p className="text-sm text-center mb-6" style={{ color: 'var(--muted)' }}>
          {deleteTarget?.status === 'CONFIRMED'
            ? 'Las materias en curso de este período volverán a estado pendiente.'
            : '¿Seguro que quieres eliminar este período?'}{' '}
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
            Cancelar
          </button>
          <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                  style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </Modal>

      {/* Modal: cerrar período (registrar resultados) */}
      <Modal
        open={!!(showClosePanel && current?.status === 'CONFIRMED')}
        onClose={() => setShowClosePanel(false)}
        title={current ? `Registrar resultados — ${current.label}` : 'Registrar resultados'}
        maxWidth="max-w-lg"
      >
        <div className="overflow-y-auto max-h-[70dvh] flex flex-col gap-3 mb-4">
          {current?.subjects.map((code) => {
            const s = allSubjects.find((x) => x.code === code)
            const r = closeResults[code] ?? { status: 'PASSED', grade: '' }
            const passed = r.status === 'PASSED'
            return (
              <div key={code} className="p-3 rounded-xl"
                   style={{ background: 'var(--surface2)', border: '1px solid var(--pt-border)' }}>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  {s?.name ?? code}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--pt-border)' }}>
                    <button
                      onClick={() => setCloseResults((prev) => ({ ...prev, [code]: { ...r, status: 'PASSED' } }))}
                      className="px-3 py-1.5 text-xs font-semibold transition-all"
                      style={{
                        background: passed ? 'rgba(110,231,183,0.2)' : 'transparent',
                        color: passed ? 'var(--accent)' : 'var(--muted)',
                      }}>
                      Aprobada
                    </button>
                    <button
                      onClick={() => setCloseResults((prev) => ({ ...prev, [code]: { ...r, status: 'FAILED' } }))}
                      className="px-3 py-1.5 text-xs font-semibold transition-all"
                      style={{
                        background: !passed ? 'rgba(248,113,113,0.2)' : 'transparent',
                        color: !passed ? '#f87171' : 'var(--muted)',
                      }}>
                      Reprobada
                    </button>
                  </div>
                  <input
                    type="number"
                    placeholder="Nota"
                    min="0"
                    max="100"
                    step="0.1"
                    value={r.grade}
                    onChange={(e) => setCloseResults((prev) => ({ ...prev, [code]: { ...r, grade: e.target.value } }))}
                    className="w-20 px-2 py-1.5 rounded-lg text-xs border outline-none"
                    style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--pt-border)' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        {closeError && <p className="text-xs mb-3" style={{ color: '#f87171' }}>{closeError}</p>}
        <button onClick={handleClose} disabled={closing}
                className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40"
                style={{ background: 'var(--accent)', color: '#0b0d12' }}>
          {closing ? 'Guardando...' : 'Cerrar período'}
        </button>
      </Modal>

      {/* Modal de detalle de materia */}
      <SubjectModal
        subject={selectedSubject}
        status={selectedStatus}
        allSubjects={allSubjects}
        getSubjectStatus={getSubjectStatus}
        preselectedCodes={currentSubjectCodes}
        onClose={() => setSelectedSubject(null)}
        onTogglePreselection={current?.status === 'OPEN' ? handleToggle : undefined}
      />
    </>
  )
}
