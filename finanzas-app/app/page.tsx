import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#0A0B0E' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)' }} />

      {/* Nav */}
      <nav className="relative z-10 max-w-5xl mx-auto px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
            <span className="text-white text-sm font-bold" style={{ fontFamily: 'var(--font-instrument-serif)' }}>F</span>
          </div>
          <span className="text-sm font-semibold text-[#E8E9F0]">Fami</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login"><Button variant="ghost" size="sm">Iniciar sesión</Button></Link>
          <Link href="/registro"><Button variant="brand" size="sm">Empezar gratis</Button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 pt-20 pb-24">
        <div className="max-w-2xl animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6"
            style={{ background: '#1A1B35', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#34D399]" style={{ animation: 'pulse-dot 2s infinite' }} />
            <span className="text-xs text-[#818CF8]">Disponible gratis para familias chilenas</span>
          </div>

          <h1 className="text-6xl leading-[1.05] tracking-[-0.04em] text-[#E8E9F0] mb-6"
            style={{ fontFamily: 'var(--font-instrument-serif)' }}>
            Entiende tu dinero.<br />
            <span style={{ background: 'linear-gradient(135deg, #818CF8, #C4B5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Cuida a los tuyos.
            </span>
          </h1>
          <p className="text-base leading-relaxed mb-10 max-w-lg" style={{ color: '#6B7280' }}>
            Registra ingresos, gastos y metas de ahorro en un solo lugar. Con Fina, tu asistente de IA que explica tus finanzas en lenguaje simple.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/registro"><Button variant="brand" size="lg">Crear mi cuenta</Button></Link>
            <Link href="/login"><Button variant="secondary" size="lg">Ya tengo cuenta</Button></Link>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-3 gap-4 mt-20">
          {features.map((f, i) => (
            <div key={f.title}
              className={`card card-hover p-6 animate-fade-up animate-fade-up-delay-${i + 1}`}>
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-5"
                style={{ background: f.iconBg, border: `1px solid ${f.iconBorder}` }}>
                <f.Icon />
              </div>
              <h3 className="text-sm font-semibold text-[#E8E9F0] mb-2">{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{f.description}</p>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-px mt-16 rounded-[12px] overflow-hidden"
          style={{ border: '1px solid #1E2028', background: '#1E2028' }}>
          {[
            { value: '100%', label: 'Gratuito' },
            { value: 'IA', label: 'Asistente Fina con Gemini' },
            { value: 'Seguro', label: 'Datos privados con Supabase' },
          ].map((s) => (
            <div key={s.label} className="py-8 text-center" style={{ background: '#13141A' }}>
              <p className="text-2xl font-semibold text-[#818CF8] mb-1">{s.value}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #1E2028' }}>
        <div className="max-w-5xl mx-auto px-8 py-6 flex items-center justify-between">
          <span className="text-xs" style={{ color: '#3D4051' }}>© 2025 Fami. Para las familias.</span>
          <span className="text-xs" style={{ color: '#3D4051' }}>Privado y seguro.</span>
        </div>
      </footer>
    </div>
  )
}

function CheckIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function TargetIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="1.75"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></svg>
}
function ChatIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FCD34D" strokeWidth="1.75"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

const features = [
  { title: 'Control de gastos', description: 'Registra cada transacción con categoría, fecha y medio de pago. Todo ordenado automáticamente.', iconBg: '#0D2E22', iconBorder: 'rgba(16,185,129,0.2)', Icon: CheckIcon },
  { title: 'Metas de ahorro', description: 'Define tu meta y fecha límite. Fami calcula cuánto debes ahorrar por mes para lograrlo.', iconBg: '#1A1B35', iconBorder: 'rgba(99,102,241,0.2)', Icon: TargetIcon },
  { title: 'Asistente Fina', description: 'Pregúntale sobre tus gastos, pídele consejos o que analice en qué estás gastando más este mes.', iconBg: '#2D2010', iconBorder: 'rgba(245,158,11,0.2)', Icon: ChatIcon },
]
