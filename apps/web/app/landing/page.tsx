'use client'
import Link from 'next/link'
import { BookOpen, GitBranch, CheckSquare, Unlock, BarChart3, ArrowRight, GraduationCap } from 'lucide-react'

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
    icon: GraduationCap,
    title: 'Múltiples universidades',
    desc: 'Compatible con varias universidades y carreras. Agrega la tuya fácilmente.',
  },
]

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
          PensumTrack te ayuda a visualizar tu pensum, gestionar prerrequisitos, planificar preselecciones y registrar tu avance académico en un solo lugar.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <Link href="/register"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition hover:opacity-90"
            style={{ background: 'var(--accent)', color: '#0b0d12' }}>
            Comenzar gratis <ArrowRight size={16} />
          </Link>
          <Link href="/login"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition hover:opacity-80"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--pt-border)' }}>
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: 'Syne, sans-serif' }}>
          Todo lo que necesitas para tu carrera
        </h2>
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
      <footer className="px-6 py-6 text-center text-xs" style={{ color: 'var(--muted)', borderTop: '1px solid var(--pt-border)' }}>
        © {new Date().getFullYear()} PensumTrack · Hecho para estudiantes
      </footer>
    </div>
  )
}
