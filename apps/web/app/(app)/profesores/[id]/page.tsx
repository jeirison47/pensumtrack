'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Star, MessageSquare, Send, Building2, Clock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const DIMS = [
  { key: 'puntualidad', label: 'Puntualidad' },
  { key: 'explicacion', label: 'Explicación' },
  { key: 'dominio', label: 'Dominio' },
  { key: 'exigencia', label: 'Exigencia' },
  { key: 'personalidad', label: 'Personalidad' },
  { key: 'apoyo', label: 'Apoyo' },
] as const

const SCHEDULE_LABELS: Record<string, string> = { MORNING: 'Mañana', AFTERNOON: 'Tarde', NIGHT: 'Noche' }

type Dim = typeof DIMS[number]['key']

interface Teaching {
  id: string
  university: { id: string; name: string; shortName: string; logoUrl: string | null }
  subjectName: string
  schedule: string[]
  ratingsCount: number
  avg: Record<Dim, number> | null
  userRating: Record<Dim, number> | null
}

interface Comment {
  id: string
  content: string
  isAnonymous: boolean
  createdAt: string
  user: { id: string; displayName: string; username: string | null } | null
}

interface ProfessorDetail {
  id: string
  name: string
  photoUrl: string | null
  bio: string | null
  overallAvg: Record<Dim, number> | null
  ratingsCount: number
  teachings: Teaching[]
  comments: Comment[]
}

function ScoreBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = (value / max) * 100
  const color = value >= 7 ? '#10b981' : value >= 5 ? '#f59e0b' : '#f87171'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-6 text-right" style={{ color }}>{value}</span>
    </div>
  )
}

function RatingSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span style={{ color: 'var(--muted)' }}>{label}</span>
        <span className="font-bold" style={{ color: 'var(--accent)' }}>{value}/10</span>
      </div>
      <input
        type="range" min={1} max={10} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-emerald-500"
      />
    </div>
  )
}

export default function ProfesorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [professor, setProfessor] = useState<ProfessorDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // Rating state
  const [ratingTeachingId, setRatingTeachingId] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<Dim, number>>({ puntualidad: 5, explicacion: 5, dominio: 5, exigencia: 5, personalidad: 5, apoyo: 5 })
  const [ratingLoading, setRatingLoading] = useState(false)

  // Comment state
  const [commentText, setCommentText] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [commentLoading, setCommentLoading] = useState(false)

  // Update request state
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [updateDetails, setUpdateDetails] = useState('')
  const [updateLoading, setUpdateLoading] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const fetchProfessor = async () => {
    try {
      const res = await fetch(`/api/professors/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setProfessor(json.data)
    } catch {
      toast.error('No se pudo cargar el profesor')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProfessor() }, [id])

  const openRatingForm = (teaching: Teaching) => {
    setRatingTeachingId(teaching.id)
    if (teaching.userRating) setScores(teaching.userRating)
    else setScores({ puntualidad: 5, explicacion: 5, dominio: 5, exigencia: 5, personalidad: 5, apoyo: 5 })
  }

  const handleRate = async () => {
    if (!ratingTeachingId) return
    setRatingLoading(true)
    try {
      const res = await fetch(`/api/professors/${id}/rate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ teachingId: ratingTeachingId, ...scores }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Calificación guardada')
      setRatingTeachingId(null)
      fetchProfessor()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al calificar')
    } finally {
      setRatingLoading(false)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    setCommentLoading(true)
    try {
      const res = await fetch(`/api/professors/${id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ content: commentText, isAnonymous }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Comentario publicado')
      setCommentText('')
      fetchProfessor()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al comentar')
    } finally {
      setCommentLoading(false)
    }
  }

  const handleUpdateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateLoading(true)
    try {
      const res = await fetch(`/api/professors/${id}/update-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ details: updateDetails }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Solicitud enviada, la revisaremos pronto')
      setUpdateDetails('')
      setShowUpdateForm(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setUpdateLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 rounded-full animate-spin"
             style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }
  if (!professor) return null

  const overallScore = professor.overallAvg
    ? Math.round((Object.values(professor.overallAvg).reduce((a, b) => a + b, 0) / 6) * 10) / 10
    : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm mb-4 cursor-pointer"
                style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={16} /> Volver
        </button>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
               style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--accent)', fontFamily: 'var(--font-syne)' }}>
            {professor.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
              {professor.name}
            </h1>
            {professor.bio && <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{professor.bio}</p>}
            {overallScore !== null && (
              <div className="flex items-center gap-1.5 mt-2">
                <Star size={16} fill="currentColor" style={{ color: '#f59e0b' }} />
                <span className="text-lg font-bold" style={{ color: '#f59e0b' }}>{overallScore}</span>
                <span className="text-sm" style={{ color: 'var(--muted)' }}>/ 10 · {professor.ratingsCount} calificaciones</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating general por dimensión */}
      {professor.overallAvg && (
        <div className="p-4 rounded-2xl space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Calificación general</p>
          {DIMS.map(({ key, label }) => (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--muted)' }}>
                <span>{label}</span>
              </div>
              <ScoreBar value={professor.overallAvg![key]} />
            </div>
          ))}
        </div>
      )}

      {/* Materias por universidad */}
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          Materias y universidades
        </p>
        {professor.teachings.map((t) => (
          <div key={t.id} className="p-4 rounded-2xl space-y-3"
               style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{t.subjectName}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
                    <Building2 size={11} /> {t.university.shortName}
                  </span>
                  {t.schedule.length > 0 && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
                      <Clock size={11} /> {t.schedule.map((s) => SCHEDULE_LABELS[s]).join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => openRatingForm(t)}
                className="text-xs px-3 py-1.5 rounded-xl font-semibold flex-shrink-0 cursor-pointer"
                style={{ background: t.userRating ? 'rgba(16,185,129,0.12)' : 'var(--accent)', color: t.userRating ? 'var(--accent)' : '#0b0d12' }}
              >
                {t.userRating ? 'Editar nota' : 'Calificar'}
              </button>
            </div>

            {t.avg && (
              <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: 'var(--pt-border)' }}>
                {DIMS.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs w-24 flex-shrink-0" style={{ color: 'var(--muted)' }}>{label}</span>
                    <ScoreBar value={t.avg![key]} />
                  </div>
                ))}
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{t.ratingsCount} calificaciones</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal calificación */}
      {ratingTeachingId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md p-5 rounded-2xl space-y-4"
               style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
            <p className="font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
              Calificar — {professor.teachings.find((t) => t.id === ratingTeachingId)?.subjectName}
            </p>
            {DIMS.map(({ key, label }) => (
              <RatingSlider key={key} label={label} value={scores[key]}
                            onChange={(v) => setScores((s) => ({ ...s, [key]: v }))} />
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setRatingTeachingId(null)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                      style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
                Cancelar
              </button>
              <button onClick={handleRate} disabled={ratingLoading}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 cursor-pointer"
                      style={{ background: 'var(--accent)', color: '#0b0d12' }}>
                {ratingLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comentarios */}
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--muted)' }}>
          <MessageSquare size={14} /> Comentarios ({professor.comments.length})
        </p>

        {/* Formulario */}
        <form onSubmit={handleComment} className="p-4 rounded-2xl space-y-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Escribe tu experiencia con este profesor..."
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--muted)' }}>
              <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)}
                     className="rounded" />
              Publicar anónimo
            </label>
            <button type="submit" disabled={!commentText.trim() || commentLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 cursor-pointer"
                    style={{ background: 'var(--accent)', color: '#0b0d12' }}>
              <Send size={13} />
              {commentLoading ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </form>

        {professor.comments.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>
            Sé el primero en comentar
          </p>
        ) : (
          professor.comments.map((c) => (
            <div key={c.id} className="p-4 rounded-2xl"
                 style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                     style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
                  {c.isAnonymous ? '?' : (c.user?.displayName?.charAt(0) ?? '?').toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                    {c.isAnonymous ? 'Anónimo' : (c.user?.displayName ?? 'Usuario')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {new Date(c.createdAt).toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <p className="text-sm" style={{ color: 'var(--text)' }}>{c.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Solicitar actualización */}
      <div className="p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
        <button onClick={() => setShowUpdateForm(!showUpdateForm)}
                className="flex items-center gap-2 text-sm w-full text-left cursor-pointer"
                style={{ color: 'var(--muted)' }}>
          <AlertCircle size={15} />
          ¿Información incorrecta o incompleta? Solicitar actualización
        </button>
        {showUpdateForm && (
          <form onSubmit={handleUpdateRequest} className="mt-3 space-y-3">
            <textarea
              value={updateDetails}
              onChange={(e) => setUpdateDetails(e.target.value)}
              placeholder="Describe qué información debe agregarse o corregirse..."
              rows={3}
              maxLength={1000}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
            />
            <button type="submit" disabled={updateDetails.length < 10 || updateLoading}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--text)' }}>
              {updateLoading ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
