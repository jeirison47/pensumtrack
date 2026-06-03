'use client'

import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'

interface Props {
  feature: string
}

export function FeatureLockedPage({ feature }: Props) {
  const router = useRouter()
  return (
    <div className="max-w-md mx-auto px-4 py-16 flex flex-col items-center text-center gap-5">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
           style={{ background: 'rgba(251,191,36,0.1)' }}>
        <Lock size={28} style={{ color: '#fbbf24' }} />
      </div>
      <div>
        <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
          Función no disponible
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          <span style={{ color: 'var(--text)' }}>{feature}</span> requiere un plan de pago. Actualiza tu plan para acceder a esta y todas las funcionalidades avanzadas.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full">
        <button onClick={() => router.push('/perfil?tab=plan')}
                className="w-full py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                style={{ background: 'var(--accent)', color: '#0b0d12' }}>
          Ver planes disponibles
        </button>
        <button onClick={() => router.back()}
                className="w-full py-2.5 rounded-2xl text-sm cursor-pointer"
                style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--muted)' }}>
          Volver
        </button>
      </div>
    </div>
  )
}
