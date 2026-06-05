'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen, GitBranch, CheckSquare, Unlock, BarChart3, ArrowRight, GraduationCap,
  Users, Star, ClipboardList, Award, Check, Mail, Sparkles,
} from 'lucide-react'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { FEATURE_LABELS } from '@/lib/features'
import type { FeatureKey } from '@/lib/features'

const CONTACT_EMAIL = 'pensumtrackapp@gmail.com'

const features = [
  {
    icon: BookOpen,
    title: 'Visualiza tu pensum',
    desc: 'Consulta todas las materias de tu carrera organizadas por semestre de forma clara.',
  },
  {
    icon: GitBranch,
    title: 'Mapa de prerrequisitos',
    desc: 'Entiende qué materias necesitas aprobar antes y planifica tu ruta de estudio.',
  },
  {
    icon: CheckSquare,
    title: 'Control de preselección',
    desc: 'Organiza los períodos académicos, confirma materias y registra los resultados.',
  },
  {
    icon: Unlock,
    title: 'Desbloqueo de materias',
    desc: 'Sabe en tiempo real qué materias puedes cursar según tu historial académico.',
  },
  {
    icon: BarChart3,
    title: 'Seguimiento de progreso',
    desc: 'Lleva un registro de tus notas, créditos aprobados y avance en la carrera.',
  },
  {
    icon: Users,
    title: 'Profesores y reseñas',
    desc: 'Consulta calificaciones y comentarios de profesores antes de elegir tus materias.',
  },
  {
    icon: Star,
    title: 'Califica a tus profesores',
    desc: 'Comparte tu experiencia y ayuda a otros estudiantes a tomar mejores decisiones.',
  },
  {
    icon: GraduationCap,
    title: 'Múltiples universidades',
    desc: 'Compatible con varias universidades y carreras. Agrega la tuya fácilmente.',
  },
  {
    icon: ClipboardList,
    title: 'Solicita tu pensum',
    desc: '¿No está tu carrera? Solicítala y la agregamos a la plataforma.',
  },
]

interface PlanData {
  id: string
  name: string
  description: string | null
  price: number | null
  isDefault: boolean
  features: { featureKey: string }[]
}

function PlansSection() {
  const { toDOP } = useExchangeRate()
  const { data, isLoading } = useQuery<{ data: PlanData[] }>({
    queryKey: ['plans-public'],
    queryFn: () => fetch('/api/plans').then((r) => r.json()),
    staleTime: 1000 * 60 * 10,
  })

  const plans = data?.data ?? []

  if (isLoading) {
    return (
      <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
        Cargando planes…
      </p>
    )
  }

  if (plans.length === 0) return null

  return (
    <div className="flex flex-wrap justify-center gap-5 max-w-5xl mx-auto">
      {plans.map((plan) => {
        const isFree = plan.isDefault || !plan.price
        const featured = !isFree
        return (
          <div key={plan.id}
            className="rounded-2xl p-6 flex flex-col gap-4 relative w-full sm:w-80 flex-shrink-0"
            style={{
              background: 'var(--surface)',
              border: `1px solid ${featured ? 'var(--accent)' : 'var(--pt-border)'}`,
              boxShadow: featured ? '0 0 0 1px var(--accent)' : 'none',
            }}>
            {featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                style={{ background: 'var(--accent)', color: '#0b0d12' }}>
                <Sparkles size={12} /> Premium
              </div>
            )}
            <div>
              <p className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>{plan.name}</p>
              {plan.description && (
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{plan.description}</p>
              )}
            </div>
            <div className="flex items-end gap-1.5">
              {isFree ? (
                <span className="text-3xl font-black" style={{ color: 'var(--accent)' }}>Gratis</span>
              ) : (
                <>
                  <span className="text-3xl font-black" style={{ color: 'var(--text)' }}>${plan.price}</span>
                  <span className="text-sm mb-1" style={{ color: 'var(--muted)' }}>
                    USD · RD${toDOP(plan.price!)}/mes
                  </span>
                </>
              )}
            </div>
            <ul className="space-y-2 flex-1">
              {plan.features.length === 0 && (
                <li className="text-sm" style={{ color: 'var(--muted)' }}>
                  Acceso básico para visualizar tu pensum.
                </li>
              )}
              {plan.features.map(({ featureKey }) => {
                const meta = FEATURE_LABELS[featureKey as FeatureKey]
                if (!meta) return null
                return (
                  <li key={featureKey} className="flex items-start gap-2 text-sm">
                    <Check size={15} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
                    <span>{meta.label}</span>
                  </li>
                )
              })}
            </ul>
            <Link href="/register"
              className="text-center py-2.5 rounded-xl text-sm font-bold transition hover:opacity-90"
              style={{
                background: featured ? 'var(--accent)' : 'var(--surface2)',
                color: featured ? '#0b0d12' : 'var(--text)',
                border: featured ? 'none' : '1px solid var(--pt-border)',
              }}>
              {isFree ? 'Comenzar gratis' : 'Elegir plan'}
            </Link>
          </div>
        )
      })}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', minHeight: '100dvh' }}>
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 sticky top-0 z-50"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--pt-border)' }}>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="PensumTrack" className="w-7 h-7 object-contain" />
          <span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>PensumTrack</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: 'var(--muted)' }}>
          <a href="#caracteristicas" className="transition hover:opacity-80">Características</a>
          <a href="#planes" className="transition hover:opacity-80">Planes</a>
          <a href="#contacto" className="transition hover:opacity-80">Contacto</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login"
            className="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-80 hidden sm:block"
            style={{ color: 'var(--muted)' }}>
            Iniciar sesión
          </Link>
          <Link href="/register"
            className="px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90"
            style={{ background: 'var(--accent)', color: '#0b0d12' }}>
            <span className="hidden sm:inline">Registrarse</span>
            <span className="sm:hidden">Entrar</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-20 gap-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--accent)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <GraduationCap size={13} /> Gestión académica inteligente
        </div>
        <h1 className="text-4xl sm:text-5xl font-black leading-tight max-w-2xl"
          style={{ fontFamily: 'Syne, sans-serif' }}>
          Controla tu carrera,<br />
          <span style={{ color: 'var(--accent)' }}>un semestre a la vez</span>
        </h1>
        <p className="text-base max-w-xl" style={{ color: 'var(--muted)' }}>
          PensumTrack te ayuda a visualizar tu pensum, gestionar prerrequisitos, planificar preselecciones, consultar profesores y registrar tu avance académico en un solo lugar.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <Link href="/register"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition hover:opacity-90"
            style={{ background: 'var(--accent)', color: '#0b0d12' }}>
            Comenzar gratis <ArrowRight size={16} />
          </Link>
          <a href="#planes"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition hover:opacity-80"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--pt-border)' }}>
            Ver planes
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="caracteristicas" className="px-6 pb-20 max-w-5xl mx-auto scroll-mt-20">
        <h2 className="text-2xl font-bold text-center mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
          Todo lo que necesitas para tu carrera
        </h2>
        <p className="text-sm text-center mb-10 max-w-xl mx-auto" style={{ color: 'var(--muted)' }}>
          Herramientas pensadas para que nunca pierdas de vista tu avance académico.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl p-5 space-y-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.12)' }}>
                <Icon size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="px-6 pb-20 scroll-mt-20"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--pt-border)', borderBottom: '1px solid var(--pt-border)', paddingTop: '5rem' }}>
        <div className="flex flex-col items-center text-center gap-2 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--accent)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <Award size={13} /> Planes y precios
          </div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
            Elige el plan que se adapta a ti
          </h2>
          <p className="text-sm max-w-xl" style={{ color: 'var(--muted)' }}>
            Empieza gratis y desbloquea funciones avanzadas cuando lo necesites. Pagos en pesos dominicanos.
          </p>
        </div>
        <PlansSection />
      </section>

      {/* Contacto */}
      <section id="contacto" className="px-6 py-20 scroll-mt-20">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
            ¿Tienes dudas o necesitas ayuda?
          </h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Escríbenos para soporte, activación de planes o para solicitar tu carrera.
          </p>
          <div className="flex justify-center mt-4">
            <a href={`mailto:${CONTACT_EMAIL}`}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition hover:opacity-90"
              style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--pt-border)' }}>
              <Mail size={16} style={{ color: 'var(--accent)' }} /> {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-2xl mx-auto rounded-2xl p-8 text-center space-y-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--pt-border)' }}>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
            ¿Listo para tomar el control?
          </h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Regístrate gratis y comienza a gestionar tu pensum en minutos.
          </p>
          <Link href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition hover:opacity-90"
            style={{ background: 'var(--accent)', color: '#0b0d12' }}>
            Crear cuenta gratis <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center space-y-2" style={{ borderTop: '1px solid var(--pt-border)' }}>
        <div className="flex items-center justify-center gap-2">
          <img src="/logo.png" alt="PensumTrack" className="w-5 h-5 object-contain" />
          <span className="font-bold text-sm" style={{ color: 'var(--accent)' }}>PensumTrack</span>
        </div>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:opacity-80">{CONTACT_EMAIL}</a>
        </p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          © {new Date().getFullYear()} PensumTrack · Hecho para estudiantes
        </p>
      </footer>
    </div>
  )
}
