'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/store/useAuthStore'

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.register(email, password, displayName)
      setAuth(res.data.user, res.data.token)
      router.replace('/onboarding')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4"
         style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-2">
          <img src="/logo.png" alt="PensumTrack" className="w-10 h-10 object-contain" />
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--accent)' }}>
            PensumTrack
          </h1>
        </div>
        <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>Empieza a gestionar tu carrera</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm" style={{ color: 'var(--muted)' }}>Nombre</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                   required placeholder="Tu nombre"
                   className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                   style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm" style={{ color: 'var(--muted)' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                   required placeholder="tu@email.com"
                   className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                   style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm" style={{ color: 'var(--muted)' }}>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                   required placeholder="Mínimo 6 caracteres" minLength={6}
                   className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                   style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }} />
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-60"
                  style={{ background: 'var(--accent)', color: '#0b0d12' }}>
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
