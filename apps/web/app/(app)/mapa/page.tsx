'use client'

import { useState } from 'react'
import { useProgress } from '@/hooks/useProgress'
import { PensumMap } from '@/components/mapa/PensumMap'
import { SubjectModal } from '@/components/layout/SubjectModal'
import type { Subject, SubjectStatus } from '@pensumtrack/types'

const LEGEND: { status: SubjectStatus; label: string; color: string }[] = [
  { status: 'passed',        label: 'Aprobada',       color: '#6ee7b7' },
  { status: 'in-progress',   label: 'En curso',        color: '#fbbf24' },
  { status: 'available',     label: 'Disponible',      color: '#38bdf8' },
  { status: 'preselected',   label: 'Preseleccionada', color: '#a78bfa' },
  { status: 'locked',        label: 'Bloqueada',       color: '#6b7280' },
]

export default function MapaPage() {
  const { profile, isLoading, getSubjectStatus, preselectedCodes } = useProgress()
  const [selected, setSelected] = useState<Subject | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<SubjectStatus>('available')

  const allSubjects = profile?.career.subjects ?? []

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
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
          Mapa de prerrequisitos
        </h1>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          Toca cualquier materia para ver su detalle.
        </p>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-3 mb-5">
          {LEGEND.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
              <div className="w-3 h-3 rounded-sm" style={{ background: color, opacity: 0.8 }} />
              {label}
            </div>
          ))}
        </div>

        <PensumMap
          subjects={allSubjects}
          getSubjectStatus={getSubjectStatus}
          onSelect={openModal}
        />
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
