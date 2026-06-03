'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { FEATURE_KEYS, FEATURE_LABELS } from '@/lib/features'
import toast from 'react-hot-toast'

export default function EditarPlanPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [features, setFeatures] = useState<string[]>([])
  const [isDefault, setIsDefault] = useState(false)
  const [saving, setSaving] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  const authHdr = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    fetch('/api/admin/plans', { headers: authHdr })
      .then((r) => r.json())
      .then((json) => {
        const plan = (json.data ?? []).find((p: { id: string }) => p.id === id)
        if (!plan) { toast.error('Plan no encontrado'); router.replace('/admin/usuarios'); return }
        setName(plan.name)
        setDescription(plan.description ?? '')
        setPrice(plan.price != null ? String(plan.price) : '')
        setFeatures(plan.features.map((f: { featureKey: string }) => f.featureKey))
        setIsDefault(plan.isDefault)
      })
      .catch(() => toast.error('Error al cargar plan'))
      .finally(() => setLoading(false))
  }, [id])

  const toggleFeature = (key: string) =>
    setFeatures((prev) => prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/plans/${id}`, {
        method: 'PATCH',
        headers: authHdr,
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          price: price ? Number(price) : null,
          features,
          isDefault,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Plan actualizado')
      router.replace('/admin/usuarios?tab=planes')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-7 h-7 border-2 rounded-full animate-spin"
             style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm mb-4 cursor-pointer hover:opacity-70"
                style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={16} /> Volver a planes
        </button>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
          Editar plan: {name}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Modifica el nombre, precio y funcionalidades de este plan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>Nombre del plan *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
                   placeholder="Ej: Gratis, Premium, Pro"
                   className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                   style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>Precio mensual (USD)</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)}
                   type="number" min="0" step="0.01" placeholder="Dejar vacío si es gratis"
                   className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                   style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>Descripción</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)}
                 placeholder="Descripción breve del plan (opcional)"
                 className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                 style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Funcionalidades incluidas</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              Lo que no esté marcado requerirá un plan superior.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {FEATURE_KEYS.map((key) => {
              const active = features.includes(key)
              return (
                <button key={key} type="button" onClick={() => toggleFeature(key)}
                        className="flex items-start gap-3 p-3 rounded-xl text-left transition-colors cursor-pointer"
                        style={{
                          background: active ? 'rgba(16,185,129,0.08)' : 'var(--surface)',
                          border: `1px solid ${active ? 'var(--accent)' : 'var(--pt-border)'}`,
                        }}>
                  <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                       style={{
                         background: active ? 'var(--accent)' : 'transparent',
                         border: `1.5px solid ${active ? 'var(--accent)' : 'var(--pt-border)'}`,
                         color: '#0b0d12',
                       }}>
                    {active && '✓'}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{FEATURE_LABELS[key].label}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{FEATURE_LABELS[key].description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer"
               style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)}
                 className="w-4 h-4" style={{ accentColor: 'var(--accent)' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Plan por defecto</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Se asigna automáticamente a nuevos usuarios al registrarse</p>
          </div>
        </label>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
                  className="flex-1 py-3 rounded-xl text-sm font-medium cursor-pointer"
                  style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--muted)' }}>
            Cancelar
          </button>
          <button type="submit" disabled={saving || !name.trim()}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer"
                  style={{ background: 'var(--accent)', color: '#0b0d12' }}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
