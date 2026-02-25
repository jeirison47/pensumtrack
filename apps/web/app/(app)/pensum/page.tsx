'use client'

import { useState, useMemo } from 'react'
import { useProgress } from '@/hooks/useProgress'
import { progressApi } from '@/services/api'
import { useProgressStore } from '@/store/useProgressStore'
import { SubjectModal } from '@/components/layout/SubjectModal'
import type { Subject, SubjectStatus } from '@pensumtrack/types'
import type { SubjectStatusDB } from '@/services/api'
import { Search } from 'lucide-react'

type Filter = 'all' | 'passed' | 'in-progress' | 'available' | 'locked' | 'preselected'

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

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',          label: 'Todas' },
  { key: 'passed',       label: 'Aprobadas' },
  { key: 'in-progress',  label: 'En curso' },
  { key: 'available',    label: 'Disponibles' },
  { key: 'preselected',  label: 'Preseleccionadas' },
  { key: 'locked',       label: 'Bloqueadas' },
]

export default function PensumPage() {
  const { profile, isLoading, getSubjectStatus, preselectedCodes, invalidateProgress } = useProgress()
  const { updateSubjectLocally } = useProgressStore()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected]     = useState<Subject | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<SubjectStatus>('pending')

  const allSubjects = profile?.career.subjects ?? []

  const filtered = useMemo(() =>
    allSubjects.filter((s) => {
      const status = getSubjectStatus(s.code)
      const matchesFilter = filter === 'all' || status === filter
      const matchesSearch = !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase())
      return matchesFilter && matchesSearch
    }),
  [allSubjects, filter, search, getSubjectStatus])

  const bySemester = useMemo(() => {
    const map = new Map<number, typeof filtered>()
    for (const s of filtered) {
      if (!map.has(s.semester)) map.set(s.semester, [])
      map.get(s.semester)!.push(s)
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [filtered])

  const openModal = (s: Subject) => {
    setSelected(s)
    setSelectedStatus(getSubjectStatus(s.code))
  }

  const handleChangeStatus = async (code: string, next: SubjectStatusDB) => {
    updateSubjectLocally(code, next)
    await progressApi.updateSubject(code, next)
    invalidateProgress()
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
        <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
          Pensum completo
        </h1>

        {/* Búsqueda */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4"
             style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
          <Search size={16} style={{ color: 'var(--muted)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
                 placeholder="Buscar materia o código..."
                 className="flex-1 bg-transparent text-sm outline-none"
                 style={{ color: 'var(--text)' }} />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: filter === key ? 'var(--accent)' : 'var(--surface)',
                      color:      filter === key ? '#0b0d12'       : 'var(--muted)',
                      border:     `1px solid ${filter === key ? 'var(--accent)' : 'var(--pt-border)'}`,
                    }}>
              {label}
            </button>
          ))}
        </div>

        {/* Materias por cuatrimestre */}
        <div className="flex flex-col gap-6">
          {bySemester.map(([sem, subjects]) => (
            <div key={sem}>
              <h2 className="text-xs font-semibold mb-3 tracking-wider" style={{ color: 'var(--muted)' }}>
                CUATRIMESTRE {sem}
              </h2>
              <div className="flex flex-col gap-2">
                {subjects.map((s) => {
                  const status = getSubjectStatus(s.code)
                  const color  = STATUS_COLORS[status]
                  return (
                    <button key={s.code} onClick={() => openModal(s)}
                            className="flex items-center justify-between p-3 rounded-xl text-left w-full transition-all hover:opacity-80"
                            style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{s.name}</p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                          {s.code} · {s.credits} crédito{s.credits !== 1 ? 's' : ''}
                          {s.prerequisites.length > 0 && ` · ${s.prerequisites.length} prereq.`}
                        </p>
                      </div>
                      <span className="text-xs font-medium ml-3 flex-shrink-0 px-2 py-1 rounded-full"
                            style={{ background: `${color}20`, color }}>
                        {STATUS_LABELS[status]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <SubjectModal
        subject={selected}
        status={selectedStatus}
        allSubjects={allSubjects}
        getSubjectStatus={getSubjectStatus}
        preselectedCodes={preselectedCodes}
        onClose={() => setSelected(null)}
        onChangeStatus={handleChangeStatus}
      />
    </>
  )
}
