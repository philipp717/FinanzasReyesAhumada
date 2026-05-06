'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }

    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (error) {
      setError(error.message.includes('already registered')
        ? 'Ya existe una cuenta con ese correo. Intenta iniciar sesión.'
        : 'Ocurrió un error. Intenta de nuevo.')
      setLoading(false)
      return
    }

    // If session exists immediately, email confirmation is disabled → go directly
    if (data.session) {
      router.push('/onboarding')
      router.refresh()
      return
    }

    // Email confirmation required
    setEmailSent(true)
    setLoading(false)
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0A0B0E' }}>
        <div className="w-full max-w-sm text-center animate-fade-up">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: '#1A1B35', border: '1px solid rgba(99,102,241,0.2)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="1.75">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#E8E9F0] mb-2">Revisa tu correo</h2>
          <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
            Te enviamos un enlace de confirmación a <strong className="text-[#E8E9F0]">{email}</strong>.<br />
            Haz click en el enlace para activar tu cuenta.
          </p>
          <Link href="/login">
            <Button variant="secondary" className="w-full">Volver al login</Button>
          </Link>
          <p className="text-xs text-[#3D4051] mt-4">
            ¿No llegó? Revisa tu carpeta de spam.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0B0E' }}>
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D0E12 0%, #13141A 100%)', borderRight: '1px solid #1E2028' }}>
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 70% 30%, rgba(139,92,246,0.1) 0%, transparent 70%)' }} />
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
              Empieza a<br />tomar control.
            </h2>
            <p className="text-sm text-[#6B7280] leading-relaxed max-w-xs">
              Crea tu cuenta gratis y comienza a entender mejor tus finanzas familiares hoy mismo.
            </p>
          </div>
          <p className="text-xs text-[#3D4051]">© 2025 Fami. Gratis. Sin tarjeta de crédito.</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-[#E8E9F0] tracking-tight mb-1">Crear cuenta</h1>
            <p className="text-sm text-[#6B7280]">Gratis. Sin tarjeta de crédito.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input id="fullName" type="text" label="Nombre completo"
              placeholder="María González" value={fullName}
              onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
            <Input id="email" type="email" label="Correo electrónico"
              placeholder="tu@correo.cl" value={email}
              onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <Input id="password" type="password" label="Contraseña"
              placeholder="Mínimo 6 caracteres" value={password}
              onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />

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
              Crear cuenta
            </Button>
          </form>

          <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid #1E2028' }}>
            <p className="text-xs text-[#6B7280]">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-[#818CF8] hover:text-[#6366F1] font-medium transition-colors">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
