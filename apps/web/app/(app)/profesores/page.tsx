'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Star, MessageSquare, GraduationCap, Building2 } from 'lucide-react'
import { universityApi, type UniversitySummary } from '@/services/api'

interface ProfessorCard {
  id: string
  name: string
  photoUrl: string | null
  bio: string | null
  overallAvg: number | null
  ratingsCount: number
  commentsCount: number
  universities: { id: string; name: string; shortName: string; logoUrl: string | null }[]
  subjects: string[]
}

const SCHEDULE_LABELS: Record<string, string> = {
  MORNING: 'Mañana',
  AFTERNOON: 'Tarde',
  NIGHT: 'Noche',
}

export default function ProfesoresPage() {
  const router = useRouter()
  const [professors, setProfessors] = useState<ProfessorCard[]>([])
  const [universities, setUniversities] = useState<UniversitySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [universityId, setUniversityId] = useState('')
  const [subject, setSubject] = useState('')

  useEffect(() => {
    universityApi.list().then((r) => setUniversities(r.data)).catch(() => {})
  }, [])

  const fetchProfessors = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (universityId) params.set('universityId', universityId)
      if (subject) params.set('subject', subject)
      const res = await fetch(`/api/professors?${params}`)
      const json = await res.json()
      setProfessors(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [search, universityId, subject])

  useEffect(() => { fetchProfessors() }, [fetchProfessors])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(q)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
            Profesores
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Califica y consulta profesores</p>
        </div>
        <button
          onClick={() => router.push('/profesores/solicitar')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: 'var(--accent)', color: '#0b0d12' }}
        >
          <Plus size={15} />
          Agregar
        </button>
      </div>

      {/* Búsqueda */}
      <form onSubmit={handleSearch} className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar profesor..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
        />
      </form>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={universityId}
          onChange={(e) => setUniversityId(e.target.value)}
          className="flex-1 min-w-[140px] px-3 py-2 rounded-xl text-sm outline-none cursor-pointer"
          style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: universityId ? 'var(--text)' : 'var(--muted)' }}
        >
          <option value="">Todas las universidades</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>{u.shortName}</option>
          ))}
        </select>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Filtrar por materia..."
          className="flex-1 min-w-[140px] px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 rounded-full animate-spin"
               style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : professors.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <GraduationCap size={40} className="mx-auto" style={{ color: 'var(--muted)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No se encontraron profesores</p>
          <button
            onClick={() => router.push('/profesores/solicitar')}
            className="text-sm font-semibold cursor-pointer"
            style={{ color: 'var(--accent)' }}
          >
            ¿Conoces alguno? Agrégalo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {professors.map((p) => (
            <button
              key={p.id}
              onClick={() => router.push(`/profesores/${p.id}`)}
              className="w-full text-left p-4 rounded-2xl transition-opacity hover:opacity-80 cursor-pointer"
              style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
                     style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--accent)', fontFamily: 'var(--font-syne)' }}>
                  {p.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{p.name}</p>
                    {p.overallAvg !== null && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star size={13} fill="currentColor" style={{ color: '#f59e0b' }} />
                        <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>{p.overallAvg}</span>
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>/ 10</span>
                      </div>
                    )}
                  </div>

                  {/* Universidades */}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {p.universities.map((u) => (
                      <span key={u.id} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
                        <Building2 size={10} />
                        {u.shortName}
                      </span>
                    ))}
                  </div>

                  {/* Materias (máx 3) */}
                  {p.subjects.length > 0 && (
                    <p className="text-xs mt-1 truncate" style={{ color: 'var(--muted)' }}>
                      {p.subjects.slice(0, 3).join(' · ')}{p.subjects.length > 3 ? ` +${p.subjects.length - 3}` : ''}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--muted)' }}>
                      <Star size={11} /> {p.ratingsCount} {p.ratingsCount === 1 ? 'calificación' : 'calificaciones'}
                    </span>
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--muted)' }}>
                      <MessageSquare size={11} /> {p.commentsCount} {p.commentsCount === 1 ? 'comentario' : 'comentarios'}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
