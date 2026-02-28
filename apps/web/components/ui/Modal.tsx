'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  /** Si se pasa, renderiza un header con título y botón X */
  title?: string
  children: React.ReactNode
  /** Tailwind max-width class. Default: 'max-w-sm' */
  maxWidth?: string
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-sm' }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} p-6 rounded-2xl`}
        style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between mb-4">
            <h3
              className="font-bold text-base"
              style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}
            >
              {title}
            </h3>
            <button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--muted)' }}>
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
