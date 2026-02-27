'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { universityApi, careerApi, progressApi } from '@/services/api'
import { useAuthStore } from '@/store/useAuthStore'
import { useProgressStore } from '@/store/useProgressStore'
import { GraduationCap, Building2, ChevronRight, ChevronLeft } from 'lucide-react'

type Step = 'university' | 'career'

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAddMode = searchParams.get('mode') === 'add'

  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const { setProfile } = useProgressStore()

  const [step, setStep] = useState<Step>('university')
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
      // Si es la primera carrera (modo inicial), actualizar perfil activo en store
      if (!isAddMode) {
        setProfile(res.data)
        queryClient.setQueryData(['progress'], { data: res.data })
      } else {
        // En modo add, solo invalidar la lista de perfiles
        queryClient.invalidateQueries({ queryKey: ['profiles'] })
      }
      router.replace(isAddMode ? '/perfil' : '/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al agregar la carrera')
    } finally {
      setLoading(false)
    }
  }

  const selectedUni = universities.find((u) => u.id === selectedUniversity)

  return (
    <div className="min-h-dvh flex flex-col px-4 py-10 max-w-lg mx-auto"
         style={{ backgroundColor: 'var(--bg)' }}>

      {/* Header */}
      <div className="mb-8">
        {step === 'career' && (
          <button onClick={handleBack}
                  className="flex items-center gap-1 text-sm mb-4 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--muted)' }}>
            <ChevronLeft size={16} />
            Cambiar universidad
          </button>
        )}

        {isAddMode && step === 'university' && (
          <button onClick={() => router.back()}
                  className="flex items-center gap-1 text-sm mb-4 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--muted)' }}>
            <ChevronLeft size={16} />
            Volver al perfil
          </button>
        )}

        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
            Paso {step === 'university' ? '1' : '2'} de 2
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
          {step === 'university'
            ? isAddMode ? 'Agregar carrera' : 'Selecciona tu universidad'
            : 'Selecciona tu carrera'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {step === 'university'
            ? 'Elige la institución donde estudias.'
            : `Carreras disponibles en ${selectedUni?.shortName ?? ''}.`}
        </p>
      </div>

      {/* Step 1 — Universities */}
      {step === 'university' && (
        uniLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 rounded-full animate-spin"
                 style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {universities.map((uni) => (
              <button key={uni.id} onClick={() => handleSelectUniversity(uni.id)}
                      className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                      style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: 'var(--surface2)' }}>
                  {uni.logoUrl
                    ? <img src={uni.logoUrl} alt={uni.shortName} className="w-8 h-8 object-contain rounded" />
                    : <Building2 size={20} style={{ color: 'var(--muted)' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{uni.name}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {uni.shortName} · {uni._count.careers} {uni._count.careers === 1 ? 'carrera' : 'carreras'}
                  </p>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
              </button>
            ))}
          </div>
        )
      )}

      {/* Step 2 — Careers */}
      {step === 'career' && (
        <>
          {careerLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 rounded-full animate-spin"
                   style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <div className="flex flex-col gap-3 mb-8">
              {careers.map((career) => (
                <button key={career.id} onClick={() => setSelectedCareer(career.id)}
                        className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                        style={{
                          background: selectedCareer === career.id ? 'rgba(110,231,183,0.1)' : 'var(--surface)',
                          border: `1px solid ${selectedCareer === career.id ? 'var(--accent)' : 'var(--pt-border)'}`,
                        }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background: selectedCareer === career.id ? 'var(--accent)' : 'var(--surface2)' }}>
                    <GraduationCap size={20}
                                   style={{ color: selectedCareer === career.id ? '#0b0d12' : 'var(--muted)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{career.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {career.totalCredits} créditos · {career.durationSemesters} cuatrimestres
                    </p>
                  </div>
                  {selectedCareer === career.id && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                         style={{ background: 'var(--accent)' }}>
                      <span style={{ color: '#0b0d12', fontSize: 12 }}>✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedCareer && (
            <div className="mb-8 p-4 rounded-2xl"
                 style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
              <label className="text-sm font-medium block mb-3" style={{ color: 'var(--text)' }}>
                ¿En qué cuatrimestre estás actualmente?
              </label>
              <div className="flex items-center gap-4">
                <button onClick={() => setSemester(Math.max(1, semester - 1))}
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
                        style={{ background: 'var(--surface2)', color: 'var(--text)' }}>−</button>
                <span className="text-2xl font-bold flex-1 text-center"
                      style={{ fontFamily: 'var(--font-syne)', color: 'var(--accent)' }}>
                  C{semester}
                </span>
                <button onClick={() => setSemester(Math.min(7, semester + 1))}
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
                        style={{ background: 'var(--surface2)', color: 'var(--text)' }}>+</button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm mb-4 text-center" style={{ color: 'var(--error, #f87171)' }}>{error}</p>
          )}

          <button onClick={handleStart} disabled={!selectedCareer || loading}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-semibold transition-opacity disabled:opacity-40"
                  style={{ background: 'var(--accent)', color: '#0b0d12' }}>
            {loading ? (isAddMode ? 'Agregando...' : 'Iniciando...') : (isAddMode ? 'Agregar carrera' : 'Comenzar')}
            {!loading && <ChevronRight size={18} />}
          </button>
        </>
      )}
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
