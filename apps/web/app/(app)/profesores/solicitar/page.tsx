'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Plus, X, Send } from 'lucide-react'
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
  const [name, setName] = useState('')
  const [universityId, setUniversityId] = useState('')
  const [universityName, setUniversityName] = useState('')
  const [subjectInput, setSubjectInput] = useState('')
  const [subjects, setSubjects] = useState<string[]>([])
  const [schedule, setSchedule] = useState('MORNING')
  const [bio, setBio] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    universityApi.list().then((r) => setUniversities(r.data)).catch(() => {})
  }, [])

  const addSubject = () => {
    const s = subjectInput.trim()
    if (!s || subjects.includes(s)) return
    setSubjects((prev) => [...prev, s])
    setSubjectInput('')
  }

  const removeSubject = (s: string) => setSubjects((prev) => prev.filter((x) => x !== s))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (subjects.length === 0) {
      toast.error('Agrega al menos una materia')
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
          universityId: universityId || undefined,
          universityName: universityId ? undefined : (universityName || undefined),
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
          <select value={universityId} onChange={(e) => { setUniversityId(e.target.value); setUniversityName('') }}
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
          <div className="flex gap-2">
            <input value={subjectInput} onChange={(e) => setSubjectInput(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubject() } }}
                   placeholder="Ej: Cálculo I"
                   className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                   style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
            <button type="button" onClick={addSubject}
                    className="px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{ background: 'var(--accent)', color: '#0b0d12' }}>
              <Plus size={16} />
            </button>
          </div>
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
