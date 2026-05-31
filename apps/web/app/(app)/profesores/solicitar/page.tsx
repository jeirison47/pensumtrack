'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, X, Send, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { universityApi, type UniversitySummary } from '@/services/api'

const SCHEDULE_OPTIONS = [
  { value: 'MORNING', label: 'Mañana' },
  { value: 'AFTERNOON', label: 'Tarde' },
  { value: 'NIGHT', label: 'Noche' },
]

export default function SolicitarProfesorPage() {
  const router = useRouter()
  const [universities, setUniversities] = useState<UniversitySummary[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [subjectSearch, setSubjectSearch] = useState('')
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false)

  const [name, setName] = useState('')
  const [universityId, setUniversityId] = useState('')
  const [universityName, setUniversityName] = useState('')
  const [subjects, setSubjects] = useState<string[]>([])
  const [schedule, setSchedule] = useState('MORNING')
  const [bio, setBio] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    universityApi.list().then((r) => setUniversities(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!universityId || universityId === '_other') {
      setAvailableSubjects([])
      return
    }
    setLoadingSubjects(true)
    fetch(`/api/universities/${universityId}/subjects`)
      .then((r) => r.json())
      .then((json) => setAvailableSubjects(json.data ?? []))
      .catch(() => setAvailableSubjects([]))
      .finally(() => setLoadingSubjects(false))
  }, [universityId])

  const toggleSubject = (s: string) => {
    setSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  const removeSubject = (s: string) => setSubjects((prev) => prev.filter((x) => x !== s))

  const filteredSubjects = availableSubjects.filter((s) =>
    s.toLowerCase().includes(subjectSearch.toLowerCase())
  )

  const handleUniversityChange = (val: string) => {
    setUniversityId(val)
    setUniversityName('')
    setSubjects([])
    setSubjectSearch('')
    setSubjectDropdownOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (subjects.length === 0) {
      toast.error('Selecciona al menos una materia')
      return
    }
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/professors/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          name,
          universityId: universityId && universityId !== '_other' ? universityId : undefined,
          universityName: universityId === '_other' ? (universityName || undefined) : undefined,
          subjects,
          schedule,
          bio: bio || undefined,
          comment: comment || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al enviar')
      setSent(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
             style={{ background: 'rgba(16,185,129,0.12)' }}>✓</div>
        <div>
          <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>¡Solicitud enviada!</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Revisaremos la información y agregaremos al profesor lo antes posible.
          </p>
        </div>
        <button onClick={() => router.replace('/profesores')}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                style={{ background: 'var(--accent)', color: '#0b0d12' }}>
          Volver a profesores
        </button>
      </div>
    )
  }

  const hasUniversity = universityId && universityId !== '_other'

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm mb-4 cursor-pointer"
                style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={16} /> Volver
        </button>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
          Solicitar agregar profesor
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          ¿Conoces un profesor que no está en PensumTrack? Envíanos sus datos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre */}
        <div className="flex flex-col gap-1">
          <label className="text-sm" style={{ color: 'var(--muted)' }}>Nombre del profesor *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
                 placeholder="Ej: Juan Pérez"
                 className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                 style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
        </div>

        {/* Universidad */}
        <div className="flex flex-col gap-1">
          <label className="text-sm" style={{ color: 'var(--muted)' }}>Universidad *</label>
          <select value={universityId} onChange={(e) => handleUniversityChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none cursor-pointer"
                  style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}>
            <option value="">Seleccionar universidad...</option>
            {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            <option value="_other">Otra (escribir)</option>
          </select>
          {universityId === '_other' && (
            <input value={universityName} onChange={(e) => setUniversityName(e.target.value)}
                   placeholder="Nombre de la universidad"
                   className="w-full px-4 py-3 rounded-xl text-sm outline-none mt-2"
                   style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
          )}
        </div>

        {/* Materias */}
        <div className="flex flex-col gap-1">
          <label className="text-sm" style={{ color: 'var(--muted)' }}>Materias que imparte *</label>

          {hasUniversity ? (
            /* Selector desde listado de la universidad */
            <div className="relative">
              <button
                type="button"
                onClick={() => setSubjectDropdownOpen((v) => !v)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none flex items-center justify-between cursor-pointer"
                style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: subjects.length ? 'var(--text)' : 'var(--muted)' }}
              >
                <span>{loadingSubjects ? 'Cargando materias...' : subjects.length === 0 ? 'Seleccionar materias...' : `${subjects.length} materia${subjects.length > 1 ? 's' : ''} seleccionada${subjects.length > 1 ? 's' : ''}`}</span>
                <ChevronDown size={15} style={{ flexShrink: 0, transform: subjectDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>

              {subjectDropdownOpen && !loadingSubjects && (
                <div className="absolute z-20 w-full mt-1 rounded-xl shadow-lg overflow-hidden"
                     style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
                  {/* Buscador interno */}
                  <div className="p-2 border-b" style={{ borderColor: 'var(--pt-border)' }}>
                    <input
                      value={subjectSearch}
                      onChange={(e) => setSubjectSearch(e.target.value)}
                      placeholder="Buscar materia..."
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: 'var(--surface2, var(--surface))', color: 'var(--text)', border: '1px solid var(--pt-border)' }}
                      autoFocus
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {filteredSubjects.length === 0 ? (
                      <p className="px-4 py-3 text-sm" style={{ color: 'var(--muted)' }}>Sin resultados</p>
                    ) : (
                      filteredSubjects.map((s) => {
                        const selected = subjects.includes(s)
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleSubject(s)}
                            className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors hover:opacity-80 cursor-pointer"
                            style={{ color: selected ? 'var(--accent)' : 'var(--text)', background: selected ? 'rgba(16,185,129,0.08)' : 'transparent' }}
                          >
                            <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-xs"
                                  style={{ background: selected ? 'var(--accent)' : 'transparent', border: `1px solid ${selected ? 'var(--accent)' : 'var(--pt-border)'}`, color: '#0b0d12' }}>
                              {selected && '✓'}
                            </span>
                            {s}
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Universidad no conocida o no seleccionada: mensaje informativo */
            <p className="text-sm px-4 py-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--muted)' }}>
              {universityId === '_other'
                ? 'Las materias se definirán al agregar el profesor manualmente.'
                : 'Selecciona una universidad para elegir materias.'}
            </p>
          )}

          {/* Chips de materias seleccionadas */}
          {subjects.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {subjects.map((s) => (
                <span key={s} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full"
                      style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--accent)' }}>
                  {s}
                  <button type="button" onClick={() => removeSubject(s)} className="cursor-pointer">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Horario */}
        <div className="flex flex-col gap-1">
          <label className="text-sm" style={{ color: 'var(--muted)' }}>Horario habitual</label>
          <div className="flex gap-2">
            {SCHEDULE_OPTIONS.map((o) => (
              <button key={o.value} type="button" onClick={() => setSchedule(o.value)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                      style={{
                        background: schedule === o.value ? 'var(--accent)' : 'var(--surface)',
                        color: schedule === o.value ? '#0b0d12' : 'var(--muted)',
                        border: `1px solid ${schedule === o.value ? 'var(--accent)' : 'var(--pt-border)'}`,
                      }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1">
          <label className="text-sm" style={{ color: 'var(--muted)' }}>
            Descripción breve <span style={{ fontSize: '0.7rem' }}>(opcional)</span>
          </label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                    placeholder="Descripción del profesor, departamento, etc."
                    rows={2} maxLength={500}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                    style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
        </div>

        {/* Comentario adicional */}
        <div className="flex flex-col gap-1">
          <label className="text-sm" style={{ color: 'var(--muted)' }}>
            Comentario adicional <span style={{ fontSize: '0.7rem' }}>(opcional)</span>
          </label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                    placeholder="Cualquier información extra que ayude a verificar los datos"
                    rows={2} maxLength={500}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                    style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
        </div>

        <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                style={{ background: 'var(--accent)', color: '#0b0d12' }}>
          <Send size={15} />
          {loading ? 'Enviando...' : 'Enviar solicitud'}
        </button>
      </form>
    </div>
  )
}
