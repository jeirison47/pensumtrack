'use client'

import { Modal } from './Modal'

interface Props {
  open: boolean
  message: string
  confirmLabel?: string
  cancelLabel?: string
  dangerous?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  dangerous = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal open={open} onClose={onCancel} maxWidth="max-w-xs">
      <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--text)' }}>
        {message}
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm transition-opacity hover:opacity-70"
          style={{ background: 'var(--surface2)', color: 'var(--muted)' }}
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
          style={{
            background: dangerous ? 'var(--danger)' : 'var(--accent)',
            color: dangerous ? '#fff' : '#0b0d12',
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
