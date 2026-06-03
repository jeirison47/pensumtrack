'use client'

import { useRouter } from 'next/navigation'
import { Lock, X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  featureLabel?: string
}

export function PlanGateModal({ open, onClose, featureLabel }: Props) {
  const router = useRouter()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)' }}
         onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-4"
           style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}
           onClick={(e) => e.stopPropagation()}>

        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
               style={{ background: 'rgba(251,191,36,0.12)' }}>
            <Lock size={22} style={{ color: '#fbbf24' }} />
          </div>
          <button onClick={onClose} className="p-1 rounded-lg cursor-pointer hover:opacity-70"
                  style={{ color: 'var(--muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div>
          <p className="font-bold text-base" style={{ color: 'var(--text)' }}>
            Función no disponible en tu plan
          </p>
          {featureLabel && (
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              <span style={{ color: 'var(--text)' }}>{featureLabel}</span> requiere un plan de pago.
            </p>
          )}
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
            Actualiza tu plan para desbloquear esta y todas las funcionalidades avanzadas de PensumTrack.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={() => { onClose(); router.push('/perfil?tab=plan') }}
            className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
            style={{ background: 'var(--accent)', color: '#0b0d12' }}>
            Ver planes disponibles
          </button>
          <button onClick={onClose}
                  className="w-full py-2.5 rounded-xl text-sm cursor-pointer"
                  style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
