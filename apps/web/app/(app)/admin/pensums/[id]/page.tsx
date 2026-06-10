'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Plus, Pencil, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Subject {
  code: string
  name: string
  credits: number
  semester: number
  periodLabel: string | null
  area: string | null
  prerequisites: string[]
  corequisites: string[]
}

interface PensumData {
  id: string
  careerName: string
  university: { name: string; shortName: string }
  year: number | null
  subjects: Subject[]
}

const authHdr = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` })

const emptyForm = { code: '', name: '', credits: 3, semester: 1, periodLabel: '', area: '', prerequisites: '', corequisites: '' }

export default function PensumSubjectsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [data, setData] = useState<PensumData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Subject | null>(null)   // materia que se edita
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteCode, setDeleteCode] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/pensums/${id}/subjects`, { headers: authHdr() })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json.data)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar')
    } finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setForm({ ...emptyForm })
    setEditing(null)
    setAdding(true)
  }
  function openEdit(s: Subject) {
    setForm({
      code: s.code, name: s.name, credits: s.credits, semester: s.semester,
      periodLabel: s.periodLabel ?? '', area: s.area ?? '',
      prerequisites: s.prerequisites.join(', '), corequisites: s.corequisites.join(', '),
    })
    setEditing(s)
    setAdding(false)
  }
  function closeForm() { setEditing(null); setAdding(false) }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name,
      credits: Number(form.credits),
      semester: Number(form.semester),
      periodLabel: form.periodLabel.trim() || null,
      area: form.area.trim() || null,
      prerequisites: form.prerequisites.split(',').map((s) => s.trim()).filter(Boolean),
      corequisites: form.corequisites.split(',').map((s) => s.trim()).filter(Boolean),
    }
    try {
      let res: Response
      if (editing) {
        res = await fetch(`/api/admin/pensums/${id}/subjects/${encodeURIComponent(editing.code)}`, { method: 'PATCH', headers: authHdr(), body: JSON.stringify(payload) })
      } else {
        res = await fetch(`/api/admin/pensums/${id}/subjects`, { method: 'POST', headers: authHdr(), body: JSON.stringify({ ...payload, code: form.code }) })
      }
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(editing ? 'Materia actualizada' : 'Materia agregada')
      closeForm()
      load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally { setSaving(false) }
  }

  async function doDelete() {
    if (!deleteCode) return
    try {
      const res = await fetch(`/api/admin/pensums/${id}/subjects/${encodeURIComponent(deleteCode)}`, { method: 'DELETE', headers: authHdr() })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Materia eliminada')
      setDeleteCode(null)
      load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  // Agrupar por semestre
  const groups = (() => {
    const map = new Map<number, Subject[]>()
    for (const s of data?.subjects ?? []) {
      if (!map.has(s.semester)) map.set(s.semester, [])
      map.get(s.semester)!.push(s)
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  })()

  const inputStyle = { background: 'var(--bg)', border: '1px solid var(--pt-border)', color: 'var(--text)' }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm cursor-pointer hover:opacity-70" style={{ color: 'var(--muted)' }}>
        <ChevronLeft size={15} /> Volver
      </button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
            {data?.careerName ?? 'Materias del pensum'}
          </h1>
          {data && (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {data.university.name}{data.year ? ` · ${data.year}` : ''} · {data.subjects.length} materias
            </p>
          )}
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer shrink-0" style={{ background: 'var(--accent)', color: '#0b0d12' }}>
          <Plus size={15} /> Agregar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} /></div>
      ) : (
        <div className="space-y-5">
          {groups.map(([sem, subjects]) => (
            <div key={sem}>
              <h2 className="text-xs font-semibold mb-2 tracking-wider" style={{ color: 'var(--muted)' }}>
                {(subjects.find((s) => s.periodLabel)?.periodLabel ?? `Cuatrimestre ${sem}`).toUpperCase()}
              </h2>
              <div className="space-y-2">
                {subjects.map((s) => (
                  <div key={s.code} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{s.name}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {s.code} · {s.credits} créd.{s.area ? ` · ${s.area}` : ''}
                        {s.prerequisites.length > 0 && ` · prereq: ${s.prerequisites.join(', ')}`}
                      </p>
                    </div>
                    <button onClick={() => openEdit(s)} title="Editar" className="p-1.5 rounded-lg hover:opacity-70 shrink-0" style={{ color: 'var(--muted)' }}><Pencil size={15} /></button>
                    <button onClick={() => setDeleteCode(s.code)} title="Eliminar" className="p-1.5 rounded-lg hover:opacity-70 shrink-0" style={{ color: 'var(--danger)' }}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal agregar/editar */}
      {(adding || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={closeForm}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={save}
                className="w-full max-w-md rounded-2xl p-5 space-y-3 max-h-[90dvh] overflow-y-auto" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
            <div className="flex items-center justify-between">
              <p className="font-bold" style={{ color: 'var(--text)' }}>{editing ? 'Editar materia' : 'Agregar materia'}</p>
              <button type="button" onClick={closeForm} style={{ color: 'var(--muted)' }}><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} disabled={!!editing} required placeholder="Código" className="px-3 py-2 rounded-xl text-sm outline-none disabled:opacity-60" style={inputStyle} />
              <input type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} required placeholder="Créditos" className="px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
            </div>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nombre de la materia" className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} required placeholder="Cuatrimestre (0 = ciclo básico)" className="px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
              <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="Área (opcional)" className="px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
            </div>
            <input value={form.periodLabel} onChange={(e) => setForm({ ...form, periodLabel: e.target.value })} placeholder="Etiqueta del bloque (ej. Electivas) — opcional" className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
            <input value={form.prerequisites} onChange={(e) => setForm({ ...form, prerequisites: e.target.value })} placeholder="Prerrequisitos (códigos separados por coma)" className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
            <input value={form.corequisites} onChange={(e) => setForm({ ...form, corequisites: e.target.value })} placeholder="Correquisitos (códigos separados por coma)" className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={closeForm} className="flex-1 py-2.5 rounded-xl text-sm cursor-pointer" style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>Cancelar</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-40" style={{ background: 'var(--accent)', color: '#0b0d12' }}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmar eliminar */}
      {deleteCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setDeleteCode(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl p-5 space-y-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
            <p className="text-sm" style={{ color: 'var(--text)' }}>¿Eliminar la materia <strong>{deleteCode}</strong>? No se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteCode(null)} className="flex-1 py-2.5 rounded-xl text-sm cursor-pointer" style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>Cancelar</button>
              <button onClick={doDelete} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: 'var(--danger)', color: '#fff' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
