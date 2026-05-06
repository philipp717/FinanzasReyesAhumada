'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QRCodeSVG } from 'qrcode.react'

interface WhatsAppStatus {
  linked: boolean
  phone: string | null
  linkedAt: string | null
  token: string | null
}

export default function ConfiguracionPage() {
  const [fullName, setFullName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)

  const [waStatus, setWaStatus] = useState<WhatsAppStatus | null>(null)
  const [waUrl, setWaUrl] = useState<string | null>(null)
  const [loadingLink, setLoadingLink] = useState(false)
  const [loadingUnlink, setLoadingUnlink] = useState(false)
  const [justLinked, setJustLinked] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadStatus = useCallback(async () => {
    const res = await fetch('/api/whatsapp/status')
    if (!res.ok) return null
    const data: WhatsAppStatus = await res.json()
    setWaStatus(data)
    return data
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('full_name').eq('id', user.id).single().then(({ data }) => {
        setFullName(data?.full_name ?? '')
      })
    })
    loadStatus()
  }, [loadStatus])

  function startPolling() {
    pollingRef.current = setInterval(async () => {
      const status = await loadStatus()
      if (status?.linked) {
        stopPolling()
        setWaUrl(null)
        setJustLinked(true)
        setTimeout(() => setJustLinked(false), 4000)
      }
    }, 2500)
  }

  function stopPolling() {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
  }

  useEffect(() => () => stopPolling(), [])

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    setSavingName(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)
    setSavingName(false)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

  async function handleLink() {
    setLoadingLink(true)
    stopPolling()
    const res = await fetch('/api/whatsapp/link', { method: 'POST' })
    const data = await res.json()
    setLoadingLink(false)
    if (data.waUrl) {
      setWaUrl(data.waUrl)
      await loadStatus()
      startPolling()
    }
  }

  async function handleUnlink() {
    setLoadingUnlink(true)
    await fetch('/api/whatsapp/unlink', { method: 'POST' })
    setLoadingUnlink(false)
    setWaUrl(null)
    stopPolling()
    await loadStatus()
  }

  function formatLinkedAt(iso: string) {
    return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-semibold text-[#E8E9F0] tracking-tight">Configuración</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Personaliza tu cuenta y conecta WhatsApp</p>
      </div>

      {/* Profile */}
      <div className="card p-6 animate-fade-up animate-fade-up-delay-1">
        <h2 className="text-sm font-semibold text-[#E8E9F0] mb-4">Perfil</h2>
        <form onSubmit={handleSaveName} className="space-y-4">
          <Input id="full_name" label="Nombre completo" placeholder="Tu nombre..."
            value={fullName} onChange={e => setFullName(e.target.value)} required />
          <Button type="submit" loading={savingName} size="sm">
            {nameSaved ? '✓ Guardado' : 'Guardar nombre'}
          </Button>
        </form>
      </div>

      {/* WhatsApp */}
      <div className="card overflow-hidden animate-fade-up animate-fade-up-delay-2">
        {/* Header with gradient */}
        <div className="px-6 pt-5 pb-4"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)', borderBottom: '1px solid #1E2028' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#E8E9F0]">Asistente WhatsApp</h2>
                <p className="text-xs text-[#6B7280]">Fami en tu WhatsApp</p>
              </div>
            </div>
            {waStatus?.linked && !justLinked && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-[#34D399] bg-[#0D2E22] px-3 py-1.5 rounded-full border border-[#34D399]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                Activo
              </span>
            )}
            {justLinked && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-[#34D399] bg-[#0D2E22] px-3 py-1.5 rounded-full border border-[#34D399]/20 animate-fade-up">
                ✓ ¡Vinculado!
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          {waStatus?.linked ? (
            <div className="space-y-4">
              <div className="rounded-[10px] overflow-hidden border border-[#1E2028]">
                <div className="flex items-center justify-between px-4 py-3" style={{ background: '#13141A', borderBottom: '1px solid #1E2028' }}>
                  <p className="text-xs text-[#6B7280]">Número vinculado</p>
                  <p className="text-sm font-semibold text-[#E8E9F0]">+{waStatus.phone}</p>
                </div>
                {waStatus.linkedAt && (
                  <div className="flex items-center justify-between px-4 py-3" style={{ background: '#13141A' }}>
                    <p className="text-xs text-[#6B7280]">Vinculado el</p>
                    <p className="text-xs text-[#6B7280]">{formatLinkedAt(waStatus.linkedAt)}</p>
                  </div>
                )}
              </div>

              <div className="rounded-[10px] border border-[#1E2028] bg-[#13141A] p-4">
                <p className="text-xs font-semibold text-[#E8E9F0] mb-3">Puedes enviarle a Fami:</p>
                <div className="space-y-2">
                  {[
                    { icon: '💬', text: '"gasté 15.990 en el Líder"' },
                    { icon: '📸', text: 'Foto de una boleta o ticket' },
                    { icon: '💳', text: 'Captura de transferencia bancaria' },
                    { icon: '❓', text: 'Preguntas sobre tus finanzas' },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5">
                      <span className="text-sm">{icon}</span>
                      <p className="text-xs text-[#6B7280]">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button variant="danger" size="sm" loading={loadingUnlink} onClick={handleUnlink}>
                Desvincular WhatsApp
              </Button>
            </div>
          ) : waUrl ? (
            // ── VIP QR STATE ──
            <div className="space-y-5">
              <p className="text-xs text-[#6B7280]">
                Escanea el código QR con tu celular para vincular tu WhatsApp con Fami.
              </p>

              {/* QR Container with glow */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-[20px] blur-xl opacity-30"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #25D366)' }} />

                  {/* QR frame */}
                  <div className="relative rounded-[20px] p-1"
                    style={{ background: 'linear-gradient(135deg, #6366F1 0%, #25D366 100%)' }}>
                    <div className="rounded-[16px] p-5 bg-white">
                      <QRCodeSVG
                        value={waUrl}
                        size={200}
                        bgColor="#FFFFFF"
                        fgColor="#0A0B0E"
                        level="M"
                        imageSettings={{
                          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23128C7E'%3E%3Cpath d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'/%3E%3C/svg%3E",
                          x: undefined,
                          y: undefined,
                          height: 36,
                          width: 36,
                          excavate: true,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div className="mt-5 w-full space-y-2">
                  {[
                    { n: '1', text: 'Abre WhatsApp en tu celular' },
                    { n: '2', text: 'Ve a Más opciones → Dispositivos vinculados' },
                    { n: '3', text: 'Toca "Vincular un dispositivo" y escanea' },
                  ].map(({ n, text }) => (
                    <div key={n} className="flex items-center gap-3 px-4 py-2.5 rounded-[8px]"
                      style={{ background: '#13141A', border: '1px solid #1E2028' }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, #6366F1, #25D366)' }}>
                        <span className="text-[10px] font-bold text-white">{n}</span>
                      </div>
                      <p className="text-xs text-[#6B7280]">{text}</p>
                    </div>
                  ))}
                </div>

                {/* Waiting indicator */}
                <div className="mt-4 flex items-center gap-2 text-xs text-[#6B7280]">
                  <span className="w-2 h-2 rounded-full bg-[#6366F1] animate-pulse" />
                  Esperando que escanees el QR...
                </div>
              </div>

              <Button variant="secondary" size="sm" onClick={() => { setWaUrl(null); stopPolling() }}>
                Cancelar
              </Button>
            </div>
          ) : (
            // ── NOT LINKED STATE ──
            <div className="space-y-4">
              <p className="text-sm text-[#6B7280]">
                Vincula tu WhatsApp para registrar gastos enviando mensajes o fotos de boletas.
                Fami los interpreta automáticamente con IA.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '📸', title: 'Fotos de boletas', desc: 'Saca foto y listo' },
                  { icon: '💬', title: 'Mensajes de texto', desc: 'Escribe el gasto' },
                  { icon: '💳', title: 'Capturas de estado', desc: 'Cuenta bancaria' },
                  { icon: '🤖', title: 'IA integrada', desc: 'Categoriza solo' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-2.5 p-3 rounded-[8px]"
                    style={{ background: '#13141A', border: '1px solid #1E2028' }}>
                    <span className="text-base">{icon}</span>
                    <div>
                      <p className="text-xs font-medium text-[#E8E9F0]">{title}</p>
                      <p className="text-[10px] text-[#6B7280]">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button loading={loadingLink} onClick={handleLink} className="w-full">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Vincular WhatsApp
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="card p-5 animate-fade-up animate-fade-up-delay-3">
        <h2 className="text-sm font-semibold text-[#E8E9F0] mb-4">Cómo funciona</h2>
        <div className="space-y-3">
          {[
            { step: '1', title: 'Vincula tu WhatsApp', text: 'Escanea el QR desde esta página con tu celular' },
            { step: '2', title: 'Envía boletas o mensajes', text: 'Foto de ticket, texto o captura de cuenta bancaria' },
            { step: '3', title: 'Fami lo analiza con IA', text: 'Extrae monto, categoría, fecha y tipo automáticamente' },
            { step: '4', title: 'Confirmas con SÍ', text: 'La transacción aparece en la app al instante, sin recargar' },
          ].map(({ step, title, text }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                <span className="text-[10px] font-bold text-white">{step}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#E8E9F0]">{title}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
