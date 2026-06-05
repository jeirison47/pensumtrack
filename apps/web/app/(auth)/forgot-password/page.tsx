'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, Eye, EyeOff, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const router = useRouter()

  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Paso 2
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al enviar el código')
      setStep('reset')
      setResendCooldown(60)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar el código')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Error al reenviar')
      }
      toast.success('Código reenviado')
      setResendCooldown(60)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al reenviar')
    }
  }

  const handleInput = (idx: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...code]
    next[idx] = value.slice(-1)
    setCode(next)
    if (value && idx < 5) inputs.current[idx + 1]?.focus()
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

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const fullCode = code.join('')
    if (fullCode.length < 6) { setError('Ingresa el código de 6 dígitos'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode, password }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'No se pudo cambiar la contraseña')
      toast.success('Contraseña actualizada. Inicia sesión.')
      router.replace('/login')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
               style={{ background: 'rgba(16,185,129,0.12)' }}>
            <KeyRound size={26} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
            {step === 'request' ? 'Recuperar contraseña' : 'Crea tu nueva contraseña'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {step === 'request'
              ? 'Ingresa tu correo y te enviaremos un código de 6 dígitos.'
              : <>Enviamos un código a <span className="font-semibold" style={{ color: 'var(--text)' }}>{email}</span></>}
          </p>
        </div>

        {step === 'request' ? (
          <form onSubmit={handleRequest} className="flex flex-col gap-4">
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="tu@email.com"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
            />
            {error && (
              <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)' }}>{error}</p>
            )}
            <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-60"
                    style={{ background: 'var(--accent)', color: '#0b0d12' }}>
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputs.current[idx] = el }}
                  type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={(e) => handleInput(idx, e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Backspace' && !code[idx] && idx > 0) inputs.current[idx - 1]?.focus() }}
                  className="w-11 h-14 rounded-xl text-center text-xl font-bold outline-none"
                  style={{ background: 'var(--surface)', border: `2px solid ${digit ? 'var(--accent)' : 'var(--pt-border)'}`, color: 'var(--text)' }}
                />
              ))}
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder="Nueva contraseña (mín. 6)" minLength={6}
                className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: 'var(--muted)' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <input
              type={showPassword ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} required
              placeholder="Repite la contraseña" minLength={6}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface)', border: `1px solid ${confirm && confirm !== password ? '#f87171' : 'var(--pt-border)'}`, color: 'var(--text)' }}
            />

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)' }}>{error}</p>
            )}

            <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-60"
                    style={{ background: 'var(--accent)', color: '#0b0d12' }}>
              {loading ? 'Guardando...' : 'Cambiar contraseña'}
            </button>

            <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
              ¿No recibiste el código?{' '}
              {resendCooldown > 0 ? (
                <span>Reenviar en {resendCooldown}s</span>
              ) : (
                <button type="button" onClick={handleResend}
                        className="font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
                  Reenviar
                </button>
              )}
            </p>
          </form>
        )}

        <div className="text-center mt-6">
          <Link href="/login"
                className="inline-flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
                style={{ color: 'var(--muted)' }}>
            <ChevronLeft size={15} /> Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
