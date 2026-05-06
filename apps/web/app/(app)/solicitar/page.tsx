'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const PERIOD_OPTIONS = [
  { value: 'semester', label: 'Semestral' },
  { value: 'quarter', label: 'Cuatrimestral' },
  { value: 'trimester', label: 'Trimestral' },
]

export default function SolicitarPage() {
  const router = useRouter()
  const [university, setUniversity] = useState('')
  const [career, setCareer] = useState('')
  const [year, setYear] = useState('')
  const [periodType, setPeriodType] = useState('semester')
  const [link, setLink] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/pensum-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          university,
          career,
          year: year ? parseInt(year) : undefined,
          periodType,
          link: link || undefined,
          comment: comment || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al enviar')
      setSent(true)
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
          style={{ background: 'rgba(16,185,129,0.12)' }}>
          ✓
        </div>
        <div>
          <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>¡Solicitud enviada!</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Revisaremos tu solicitud y agregaremos la carrera o pensum lo antes posible.
          </p>
        </div>
        <button onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--accent)', color: '#0b0d12' }}>
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <button onClick={() => router.back()}
          className="flex items-center gap-1 text-sm mb-4 transition-opacity hover:opacity-70"
          style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={16} /> Volver
        </button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-syne)' }}>
          Solicitud de agregar carrera o pensum
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          ¿No encuentras tu carrera o pensum? Envíanos los datos y lo agregaremos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm" style={{ color: 'var(--muted)' }}>Universidad *</label>
          <input
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            required
            placeholder="Ej: ITLA, UASD, PUCMM"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm" style={{ color: 'var(--muted)' }}>Carrera *</label>
          <input
            value={career}
            onChange={(e) => setCareer(e.target.value)}
            required
            placeholder="Ej: Ingeniería en Sistemas"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm" style={{ color: 'var(--muted)' }}>Año del pensum</label>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              type="number"
              placeholder="Ej: 2024"
              min={1990}
              max={2100}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm" style={{ color: 'var(--muted)' }}>Tipo de período</label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm" style={{ color: 'var(--muted)' }}>Enlace al pensum <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>(opcional)</span></label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            type="url"
            placeholder="https://..."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm" style={{ color: 'var(--muted)' }}>
            Comentario <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>(opcional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Contexto adicional: dónde encontraste el pensum, versión específica, etc."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
          />
          <p className="text-xs text-right" style={{ color: 'var(--muted)' }}>{comment.length}/500</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
          style={{ background: 'var(--accent)', color: '#0b0d12' }}
        >
          <Send size={15} />
          {loading ? 'Enviando...' : 'Enviar solicitud'}
        </button>
      </form>
    </div>
  )
}
