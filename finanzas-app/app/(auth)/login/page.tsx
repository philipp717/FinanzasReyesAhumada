'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setError('Debes confirmar tu correo electrónico. Revisa tu bandeja de entrada.')
      } else if (error.message.includes('Invalid login credentials')) {
        setError('Correo o contraseña incorrectos.')
      } else {
        setError('Ocurrió un error. Intenta de nuevo.')
      }
      setLoading(false)
      return
    }

    // Check if onboarding is complete
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', data.user.id)
      .single()

    if (!profile?.onboarding_completed) {
      router.push('/onboarding')
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0B0E' }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D0E12 0%, #13141A 100%)', borderRight: '1px solid #1E2028' }}>
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <span className="text-white text-sm font-bold" style={{ fontFamily: 'var(--font-instrument-serif)' }}>F</span>
            </div>
            <span className="text-sm font-semibold text-[#E8E9F0]">Fami</span>
          </div>
          <div>
            <h2 className="text-4xl text-[#E8E9F0] leading-[1.15] tracking-[-0.03em] mb-4"
              style={{ fontFamily: 'var(--font-instrument-serif)' }}>
              Tu dinero,<br />bajo control.
            </h2>
            <p className="text-sm text-[#6B7280] leading-relaxed max-w-xs">
              Registra ingresos, gastos y metas de ahorro. Con un asistente que entiende tus finanzas.
            </p>
            <div className="mt-10 space-y-3">
              {['Registro de transacciones', 'Metas de ahorro', 'Asistente financiero Fina'].map((f) => (
                <div key={f} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: '#0D2E22' }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs text-[#6B7280]">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-[#3D4051]">© 2025 Fami. Todos los derechos reservados.</p>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-[#E8E9F0] tracking-tight mb-1">Bienvenido de vuelta</h1>
            <p className="text-sm text-[#6B7280]">Ingresa a tu cuenta para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input id="email" type="email" label="Correo electrónico"
              placeholder="tu@correo.cl" value={email}
              onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <Input id="password" type="password" label="Contraseña"
              placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />

            {error && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-[8px]"
                style={{ background: '#2D1515', border: '1px solid rgba(239,68,68,0.2)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" className="mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
                </svg>
                <p className="text-xs text-[#F87171]">{error}</p>
              </div>
            )}

            <Button type="submit" variant="brand" className="w-full" loading={loading}>
              Iniciar sesión
            </Button>
          </form>

          <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid #1E2028' }}>
            <p className="text-xs text-[#6B7280]">
              ¿No tienes cuenta?{' '}
              <Link href="/registro" className="text-[#818CF8] hover:text-[#6366F1] font-medium transition-colors">
                Crear cuenta gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
