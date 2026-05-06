'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const steps = [
  { id: 'income',         title: '¿Cuánto ganas al mes?',         subtitle: 'Tu ingreso mensual aproximado en pesos chilenos' },
  { id: 'income_type',    title: '¿Tu ingreso es fijo o variable?', subtitle: 'Esto nos ayuda a planificar tu presupuesto' },
  { id: 'savings',        title: '¿Tienes alguna meta de ahorro?', subtitle: 'Puedes ajustarla después cuando quieras' },
  { id: 'debts',          title: '¿Tienes deudas actualmente?',    subtitle: 'Para calcular tu capacidad real de ahorro' },
  { id: 'recommendations',title: 'Casi listo',                     subtitle: '¿Quieres que Fina te dé consejos personalizados?' },
]

type FormData = {
  monthly_income: string; income_type: 'fijo' | 'variable' | ''
  wants_to_save: boolean | null; saving_goal: string
  saving_goal_amount: string; saving_timeframe_months: string
  has_debts: boolean | null; monthly_saving_capacity: string
  wants_recommendations: boolean
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormData>({
    monthly_income: '', income_type: '', wants_to_save: null,
    saving_goal: '', saving_goal_amount: '', saving_timeframe_months: '',
    has_debts: null, monthly_saving_capacity: '', wants_recommendations: true,
  })

  const pct = (step / steps.length) * 100
  const set = (f: keyof FormData, v: string | boolean) => setForm(p => ({ ...p, [f]: v }))

  function canProceed() {
    if (step === 0) return !!form.monthly_income && Number(form.monthly_income) > 0
    if (step === 1) return !!form.income_type
    if (step === 2) return form.wants_to_save !== null
    if (step === 3) return form.has_debts !== null
    return true
  }

  async function finish() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').upsert({
      id: user.id, onboarding_completed: true,
      onboarding_data: {
        monthly_income: Number(form.monthly_income), income_type: form.income_type,
        wants_to_save: form.wants_to_save, saving_goal: form.saving_goal,
        saving_goal_amount: Number(form.saving_goal_amount) || 0,
        saving_timeframe_months: Number(form.saving_timeframe_months) || 0,
        has_debts: form.has_debts,
        monthly_saving_capacity: Number(form.monthly_saving_capacity) || 0,
        wants_recommendations: form.wants_recommendations,
      },
    })

    if (form.wants_to_save && form.saving_goal) {
      const months = Number(form.saving_timeframe_months) || 12
      const deadline = new Date()
      deadline.setMonth(deadline.getMonth() + months)
      await supabase.from('saving_goals').insert({
        user_id: user.id,
        name: form.saving_goal,
        target_amount: Number(form.saving_goal_amount) || 0,
        current_amount: 0,
        deadline: deadline.toISOString().split('T')[0],
      })
    }

    router.push('/dashboard')
  }

  const OptionBtn = ({ value, label, desc, field }: { value: boolean | string; label: string; desc: string; field: keyof FormData }) => {
    const active = form[field] === value
    return (
      <button onClick={() => set(field, value as string | boolean)}
        className="w-full text-left p-4 rounded-[10px] transition-all duration-150"
        style={{
          background: active ? 'rgba(99,102,241,0.12)' : '#13141A',
          border: `1px solid ${active ? 'rgba(99,102,241,0.4)' : '#1E2028'}`,
        }}>
        <p className="text-sm font-medium" style={{ color: active ? '#818CF8' : '#E8E9F0' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: active ? '#6366F1' : '#6B7280' }}>{desc}</p>
      </button>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0A0B0E' }}>
      <div className="w-full max-w-lg animate-fade-up">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-7 h-7 rounded-[6px] flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
              <span className="text-white text-xs font-bold" style={{ fontFamily: 'var(--font-instrument-serif)' }}>F</span>
            </div>
            <span className="text-sm font-semibold text-[#E8E9F0]">Fami</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[#6B7280]">Paso {step + 1} de {steps.length}</p>
            <p className="text-xs text-[#6366F1]">{Math.round(pct)}%</p>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1E2028' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6366F1,#8B5CF6)' }} />
          </div>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-semibold text-[#E8E9F0] tracking-tight mb-1">{steps[step].title}</h2>
          <p className="text-sm text-[#6B7280] mb-8">{steps[step].subtitle}</p>

          {step === 0 && (
            <Input id="income" type="number" label="Ingreso mensual (CLP)"
              placeholder="500000" value={form.monthly_income}
              onChange={e => set('monthly_income', e.target.value)}
              hint="Aproximado está bien, puedes cambiarlo después" />
          )}

          {step === 1 && (
            <div className="space-y-3">
              <OptionBtn value="fijo" label="Fijo" desc="Siempre recibo el mismo monto cada mes" field="income_type" />
              <OptionBtn value="variable" label="Variable" desc="Mi ingreso cambia según el mes" field="income_type" />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <OptionBtn value={true} label="Sí, tengo una meta" desc="Quiero ahorrar para algo específico" field="wants_to_save" />
                <OptionBtn value={false} label="Por ahora no" desc="Solo quiero controlar mis gastos" field="wants_to_save" />
              </div>
              {form.wants_to_save && (
                <div className="space-y-3 pt-4" style={{ borderTop: '1px solid #1E2028' }}>
                  <Input id="goal" label="¿Para qué quieres ahorrar?"
                    placeholder="Vacaciones, auto, fondo de emergencia..."
                    value={form.saving_goal} onChange={e => set('saving_goal', e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input id="amount" type="number" label="Monto objetivo (CLP)"
                      placeholder="1000000" value={form.saving_goal_amount}
                      onChange={e => set('saving_goal_amount', e.target.value)} />
                    <Input id="months" type="number" label="¿En cuántos meses?"
                      placeholder="12" value={form.saving_timeframe_months}
                      onChange={e => set('saving_timeframe_months', e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <OptionBtn value={true} label="Sí, tengo deudas" desc="Crédito, tarjeta, préstamo u otro" field="has_debts" />
                <OptionBtn value={false} label="No tengo deudas" desc="Estoy libre de compromisos financieros" field="has_debts" />
              </div>
              <Input id="capacity" type="number" label="¿Cuánto puedes ahorrar al mes? (CLP)"
                placeholder="50000" value={form.monthly_saving_capacity}
                onChange={e => set('monthly_saving_capacity', e.target.value)}
                hint="Una estimación está bien" />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <OptionBtn value={true} label="Sí, quiero consejos" desc="Alertas de gastos altos y recomendaciones de ahorro" field="wants_recommendations" />
              <OptionBtn value={false} label="Solo ver mis datos" desc="Sin alertas ni sugerencias automáticas" field="wants_recommendations" />
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid #1E2028' }}>
            <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0}>Atrás</Button>
            {step < steps.length - 1
              ? <Button variant="brand" onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>Continuar</Button>
              : <Button variant="brand" onClick={finish} loading={loading}>Comenzar con Fami</Button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
