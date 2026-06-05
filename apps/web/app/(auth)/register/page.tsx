'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useRedirectIfAuth } from '@/hooks/useRedirectIfAuth'
import { Turnstile } from '@/components/ui/Turnstile'

const CAPTCHA_ENABLED = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export default function RegisterPage() {
  const router = useRouter()
  const checkingAuth = useRedirectIfAuth()
  const { setAuth } = useAuthStore()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaKey, setCaptchaKey] = useState(0)

  const handleUsernameChange = (value: string) => {
    setUsername(value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (username.length < 3) {
      setError('El usuario debe tener al menos 3 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (CAPTCHA_ENABLED && !captchaToken) {
      setError('Completa la verificación de seguridad')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, displayName, turnstileToken: captchaToken }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al crear la cuenta')

      if (json.data.requiresVerification) {
        router.replace(`/verify-email?pendingId=${json.data.pendingId}&email=${encodeURIComponent(json.data.email)}`)
        return
      }

      setAuth(json.data.user, json.data.token)
      router.replace('/onboarding')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta')
      // El token de Turnstile es de un solo uso: reiniciar el widget tras un fallo
      setCaptchaToken('')
      setCaptchaKey((k) => k + 1)
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
             style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-8"
         style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-sm md:max-w-xl">
        <div className="flex items-center gap-3 mb-2">
          <img src="/logo.png" alt="PensumTrack" className="w-10 h-10 object-contain" />
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--accent)' }}>
            PensumTrack
          </h1>
        </div>
        <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>Empieza a gestionar tu carrera</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm" style={{ color: 'var(--muted)' }}>Nombre</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="Tu nombre"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm" style={{ color: 'var(--muted)' }}>Usuario</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm select-none"
                    style={{ color: 'var(--muted)' }}>@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                required
                placeholder="tu_usuario"
                maxLength={20}
                className="w-full pl-8 pr-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
              />
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Solo letras minúsculas, números y guiones bajos</p>
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm" style={{ color: 'var(--muted)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm" style={{ color: 'var(--muted)' }}>Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: 'var(--muted)' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm" style={{ color: 'var(--muted)' }}>Confirmar contraseña</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repite tu contraseña"
                minLength={6}
                className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${confirmPassword && confirmPassword !== password ? '#f87171' : 'var(--pt-border)'}`,
                  color: 'var(--text)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: 'var(--muted)' }}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="text-xs" style={{ color: '#f87171' }}>Las contraseñas no coinciden</p>
            )}
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg md:col-span-2" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)' }}>
              {error}
            </p>
          )}

          {CAPTCHA_ENABLED && (
            <div className="md:col-span-2">
              <Turnstile
                key={captchaKey}
                onVerify={setCaptchaToken}
                onExpire={() => setCaptchaToken('')}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-60 md:col-span-2"
            style={{ background: 'var(--accent)', color: '#0b0d12' }}
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--muted)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: 'var(--accent)' }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
