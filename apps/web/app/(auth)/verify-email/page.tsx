'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

function VerifyEmailContent() {
  const router = useRouter()
  const params = useSearchParams()
  const { setAuth } = useAuthStore()

  const userId = params.get('userId') ?? ''
  const email = params.get('email') ?? ''

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!userId) router.replace('/login')
  }, [userId, router])

  // Al llegar aquí ya se envió un código (registro o login sin verificar):
  // espera inicial de 1 min antes de poder reenviar.
  useEffect(() => {
    setResendCooldown(60)
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const handleInput = (idx: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const digit = value.slice(-1)
    const next = [...code]
    next[idx] = digit
    setCode(next)
    if (digit && idx < 5) inputs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    const next = [...code]
    text.split('').forEach((d, i) => { next[i] = d })
    setCode(next)
    inputs.current[Math.min(text.length, 5)]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length < 6) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: fullCode }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Código inválido')

      setAuth(json.data.user, json.data.token)
      router.replace('/onboarding')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Código inválido')
      setCode(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setResending(true)
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const json = await res.json()
      if (!res.ok) {
        // Si el servidor indica cuánto esperar, reflejarlo en el contador
        if (typeof json.retryAfterSec === 'number') setResendCooldown(json.retryAfterSec)
        throw new Error(json.error ?? 'Error al reenviar')
      }
      toast.success('Código reenviado')
      setResendCooldown(json.data?.nextResendInSec ?? 60)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al reenviar')
    } finally {
      setResending(false)
    }
  }

  const formatCooldown = (sec: number) => {
    if (sec < 60) return `${sec}s`
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const isComplete = code.every((d) => d !== '')

  return (
    <div className="min-h-dvh flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
               style={{ background: 'rgba(16,185,129,0.12)' }}>
            <ShieldCheck size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-2xl font-bold mb-2"
              style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
            Verifica tu correo
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Enviamos un código de 6 dígitos a{' '}
            <span className="font-semibold" style={{ color: 'var(--text)' }}>{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputs.current[idx] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInput(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-14 rounded-xl text-center text-xl font-bold outline-none transition-all"
                style={{
                  background: 'var(--surface)',
                  border: `2px solid ${digit ? 'var(--accent)' : 'var(--pt-border)'}`,
                  color: 'var(--text)',
                }}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={!isComplete || loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-40"
            style={{ background: 'var(--accent)', color: '#0b0d12' }}
          >
            {loading ? 'Verificando...' : 'Verificar cuenta'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            ¿No recibiste el código?{' '}
            {resendCooldown > 0 ? (
              <span style={{ color: 'var(--muted)' }}>Reenviar en {formatCooldown(resendCooldown)}</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="font-semibold transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ color: 'var(--accent)' }}
              >
                {resending ? 'Enviando...' : 'Reenviar código'}
              </button>
            )}
          </p>
        </div>

        <div className="text-center mt-3">
          <button
            onClick={() => router.replace('/login')}
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--muted)' }}
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
