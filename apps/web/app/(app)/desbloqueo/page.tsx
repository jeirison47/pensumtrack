'use client'

import { useState, useMemo } from 'react'
import { useProgress } from '@/hooks/useProgress'
import { SubjectModal } from '@/components/layout/SubjectModal'
import { getUnlockedBySubject } from '@pensumtrack/utils'
import type { Subject, SubjectStatus } from '@pensumtrack/types'
import { Unlock, Lock, ChevronRight } from 'lucide-react'

export default function DesbloqueoPage() {
  const { profile, isLoading, getSubjectStatus, preselectedCodes } = useProgress()
  const [selected, setSelected] = useState<Subject | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<SubjectStatus>('available')

  const allSubjects = profile?.career.subjects ?? []

  const studentSubjects = useMemo(() =>
    (profile?.subjects ?? []).map((s) => ({
      subjectCode: s.subjectCode,
      status: s.status === 'IN_PROGRESS' ? 'in-progress' as const
            : s.status === 'PASSED'      ? 'passed' as const
            : s.status === 'FAILED'      ? 'failed' as const
            : 'pending' as const,
    })),
  [profile])

  const available = useMemo(() =>
    allSubjects.filter((s) => getSubjectStatus(s.code) === 'available'),
  [allSubjects, getSubjectStatus])

  const locked = useMemo(() =>
    allSubjects.filter((s) => getSubjectStatus(s.code) === 'locked'),
  [allSubjects, getSubjectStatus])

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

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
          Desbloqueo
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
          Tienes <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{available.length} materia{available.length !== 1 ? 's' : ''}</span> disponibles para el próximo período.
        </p>

        {/* Disponibles */}
        {available.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold mb-3 tracking-wider flex items-center gap-2"
                style={{ color: 'var(--accent)' }}>
              <Unlock size={12} /> DISPONIBLES AHORA
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {available.map((s) => (
                <button key={s.code} onClick={() => openModal(s)}
                        className="flex items-center justify-between p-3 rounded-xl text-left transition-all hover:opacity-80"
                        style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{s.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {s.code} · {s.credits} cr. · C{s.semester}
                    </p>
                    {s.prerequisites.length === 0 && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>Sin prerrequisitos</p>
                    )}
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Bloqueadas */}
        {locked.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold mb-3 tracking-wider flex items-center gap-2"
                style={{ color: 'var(--muted)' }}>
              <Lock size={12} /> BLOQUEADAS — QUÉ FALTA
            </h2>
            <div className="flex flex-col gap-2">
              {locked.map((s) => {
                const missingPrereqs = s.prerequisites.filter((code) => {
                  const st = getSubjectStatus(code)
                  return st !== 'passed' && st !== 'in-progress'
                })
                const unlocksCount = getUnlockedBySubject(s.code, allSubjects, studentSubjects, preselectedCodes).length

                return (
                  <button key={s.code} onClick={() => openModal(s)}
                          className="flex items-start justify-between p-3 rounded-xl text-left transition-all hover:opacity-80"
                          style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{s.name}</p>
                      <p className="text-xs mb-1.5" style={{ color: 'var(--muted)' }}>
                        {s.code} · {s.credits} cr. · C{s.semester}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {missingPrereqs.map((code) => {
                          const prereq = allSubjects.find((sub) => sub.code === code)
                          return (
                            <span key={code} className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)' }}>
                              Falta: {prereq?.name ?? code}
                            </span>
                          )
                        })}
                      </div>
                      {unlocksCount > 0 && (
                        <p className="text-xs mt-1" style={{ color: 'var(--accent2)' }}>
                          Desbloquea {unlocksCount} materia{unlocksCount !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--muted)', flexShrink: 0, marginTop: 2 }} />
                  </button>
                )
              })}
            </div>
          </section>
        )}
      </div>

      <SubjectModal
        subject={selected}
        status={selectedStatus}
        allSubjects={allSubjects}
        getSubjectStatus={getSubjectStatus}
        preselectedCodes={preselectedCodes}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
