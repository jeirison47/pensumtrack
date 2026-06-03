'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { universityApi, careerApi, progressApi } from '@/services/api'
import { useAuthStore } from '@/store/useAuthStore'
import { useProgressStore } from '@/store/useProgressStore'
import Link from 'next/link'
import { GraduationCap, Building2, ChevronRight, ChevronLeft, SkipForward, Plus } from 'lucide-react'

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAddMode = searchParams.get('mode') === 'add'

  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const { setProfile } = useProgressStore()

  const [step, setStep] = useState<'university' | 'career'>('university')
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null)
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null)
  const [semester, setSemester] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { data: uniData, isLoading: uniLoading } = useQuery({
    queryKey: ['universities'],
    queryFn: () => universityApi.list(),
    enabled: isAuthenticated,
  })

  const { data: careerData, isLoading: careerLoading } = useQuery({
    queryKey: ['careers', selectedUniversity],
    queryFn: () => careerApi.list(selectedUniversity!),
    enabled: !!selectedUniversity && step === 'career',
  })

  const universities = uniData?.data ?? []
  const careers = careerData?.data ?? []
  const selectedUni = universities.find((u) => u.id === selectedUniversity)

  const handleSelectUniversity = (id: string) => {
    setSelectedUniversity(id)
    setSelectedCareer(null)
    setStep('career')
  }

  const handleBack = () => {
    setStep('university')
    setSelectedCareer(null)
    setError('')
  }

  const handleStart = async () => {
    if (!selectedCareer) return
    setLoading(true)
    setError('')
    try {
      const res = await progressApi.addCareer(selectedCareer, semester)
      if (!isAddMode) {
        setProfile(res.data)
        queryClient.setQueryData(['progress'], { data: res.data })
      } else {
        queryClient.invalidateQueries({ queryKey: ['profiles'] })
      }
      router.replace(isAddMode ? '/perfil' : '/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al agregar la carrera')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-start px-4 py-8 md:py-16"
         style={{ backgroundColor: 'var(--bg)' }}>

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 self-start md:self-center">
        <img src="/logo.png" alt="PensumTrack" className="w-8 h-8 object-contain" />
        <span className="font-bold text-xl" style={{ fontFamily: 'var(--font-syne)', color: 'var(--accent)' }}>
          PensumTrack
        </span>
      </div>

      <div className="w-full max-w-xl">
        {/* Barra de progreso */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex gap-2">
            {[1, 2].map((n) => {
              const current = step === 'university' ? 1 : 2
              return (
                <div key={n} className="h-1.5 rounded-full transition-all"
                     style={{
                       width: n === current ? 32 : 16,
                       background: n <= current ? 'var(--accent)' : 'var(--surface2)',
                     }} />
              )
            })}
          </div>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            Paso {step === 'university' ? 1 : 2} de 2
          </span>
        </div>

        {/* Header del paso */}
        <div className="mb-6">
          {step === 'career' && (
            <button onClick={handleBack}
                    className="flex items-center gap-1 text-sm mb-3 cursor-pointer transition-opacity hover:opacity-70"
                    style={{ color: 'var(--muted)' }}>
              <ChevronLeft size={15} /> Cambiar universidad
            </button>
          )}
          {isAddMode && step === 'university' && (
            <button onClick={() => router.back()}
                    className="flex items-center gap-1 text-sm mb-3 cursor-pointer transition-opacity hover:opacity-70"
                    style={{ color: 'var(--muted)' }}>
              <ChevronLeft size={15} /> Volver al perfil
            </button>
          )}

          <h1 className="text-2xl md:text-3xl font-bold mb-1"
              style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
            {step === 'university'
              ? isAddMode ? 'Agregar carrera' : 'Selecciona tu universidad'
              : 'Selecciona tu carrera'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {step === 'university'
              ? 'Elige la institución donde estudias.'
              : `Carreras disponibles en ${selectedUni?.name ?? ''}.`}
          </p>
        </div>

        {/* ── Paso 1: Universidades ── */}
        {step === 'university' && (
          <div className="space-y-4">
            {uniLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 border-2 rounded-full animate-spin"
                     style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
              </div>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {universities.map((uni) => (
                  <button key={uni.id} onClick={() => handleSelectUniversity(uni.id)}
                          className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all hover:opacity-80 cursor-pointer"
                          style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                         style={{ background: 'var(--surface2)' }}>
                      {uni.logoUrl
                        ? <img src={uni.logoUrl} alt={uni.shortName} className="w-8 h-8 object-contain rounded" />
                        : <Building2 size={18} style={{ color: 'var(--muted)' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{uni.name}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {uni.shortName} · {uni._count.careers} {uni._count.careers === 1 ? 'carrera' : 'carreras'}
                      </p>
                    </div>
                    <ChevronRight size={15} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            )}

            {/* Separador y opciones extra */}
            {!uniLoading && (
              <div className="pt-2 space-y-2">
                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: 'var(--pt-border)' }} />
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>¿No encuentras tu universidad?</span>
                  <div className="flex-1 h-px" style={{ background: 'var(--pt-border)' }} />
                </div>

                <Link href="/solicitar"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-medium transition-opacity hover:opacity-80 cursor-pointer"
                      style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)', color: 'var(--text)' }}>
                  <Plus size={15} style={{ color: 'var(--accent)' }} />
                  Solicitar agregar universidad / pensum
                </Link>

                {!isAddMode && (
                  <button onClick={() => router.replace('/dashboard')}
                          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm transition-opacity hover:opacity-70 cursor-pointer"
                          style={{ color: 'var(--muted)' }}>
                    <SkipForward size={15} />
                    Omitir por ahora, configurar desde mi perfil
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Paso 2: Carreras ── */}
        {step === 'career' && (
          <div className="space-y-4">
            {careerLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 border-2 rounded-full animate-spin"
                     style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
              </div>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {careers.map((career) => {
                  const active = selectedCareer === career.id
                  return (
                    <button key={career.id} onClick={() => setSelectedCareer(career.id)}
                            className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all cursor-pointer hover:opacity-80"
                            style={{
                              background: active ? 'rgba(16,185,129,0.08)' : 'var(--surface)',
                              border: `1px solid ${active ? 'var(--accent)' : 'var(--pt-border)'}`,
                            }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                           style={{ background: active ? 'var(--accent)' : 'var(--surface2)' }}>
                        <GraduationCap size={18} style={{ color: active ? '#0b0d12' : 'var(--muted)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{career.name}</p>
                        {(career.totalCredits || career.durationSemesters) && (
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>
                            {career.totalCredits ? `${career.totalCredits} créditos` : ''}
                            {career.totalCredits && career.durationSemesters ? ' · ' : ''}
                            {career.durationSemesters ? `${career.durationSemesters} cuatrimestres` : ''}
                          </p>
                        )}
                      </div>
                      {active && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                             style={{ background: 'var(--accent)', color: '#0b0d12' }}>✓</div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Selector de cuatrimestre */}
            {selectedCareer && (
              <div className="p-4 rounded-2xl"
                   style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
                <p className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
                  ¿En qué cuatrimestre estás actualmente?
                </p>
                <div className="flex items-center gap-4">
                  <button onClick={() => setSemester(Math.max(1, semester - 1))}
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl cursor-pointer transition-opacity hover:opacity-70"
                          style={{ background: 'var(--surface2)', color: 'var(--text)' }}>−</button>
                  <span className="text-2xl font-bold flex-1 text-center"
                        style={{ fontFamily: 'var(--font-syne)', color: 'var(--accent)' }}>
                    C{semester}
                  </span>
                  <button onClick={() => setSemester(Math.min(16, semester + 1))}
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl cursor-pointer transition-opacity hover:opacity-70"
                          style={{ background: 'var(--surface2)', color: 'var(--text)' }}>+</button>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-center px-3 py-2 rounded-xl"
                 style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)' }}>{error}</p>
            )}

            <button onClick={handleStart} disabled={!selectedCareer || loading}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-semibold text-sm transition-opacity disabled:opacity-40 cursor-pointer"
                    style={{ background: 'var(--accent)', color: '#0b0d12' }}>
              {loading
                ? (isAddMode ? 'Agregando...' : 'Iniciando...')
                : (isAddMode ? 'Agregar carrera' : 'Comenzar')}
              {!loading && <ChevronRight size={16} />}
            </button>

            <button onClick={() => router.push('/solicitar')}
                    className="w-full py-2.5 text-sm text-center transition-opacity hover:opacity-70 cursor-pointer"
                    style={{ color: 'var(--muted)' }}>
              ¿No encuentras tu carrera? Solicitar que la agreguen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
             style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
