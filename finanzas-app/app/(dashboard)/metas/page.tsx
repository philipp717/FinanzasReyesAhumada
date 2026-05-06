'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import type { SavingGoal } from '@/types'

export default function MetasPage() {
  const [goals, setGoals] = useState<SavingGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', target_amount: '', deadline: '' })

  const loadGoals = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('saving_goals').select('*').eq('user_id', user.id)
    setGoals(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadGoals() }, [loadGoals])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('saving_goals').insert({
      user_id: user.id,
      name: form.name,
      target_amount: Number(form.target_amount),
      current_amount: 0,
      deadline: form.deadline,
    })

    setForm({ name: '', target_amount: '', deadline: '' })
    setShowForm(false)
    setSaving(false)
    loadGoals()
  }

  async function addAmount(goalId: string, current: number, target: number) {
    const input = prompt('¿Cuánto quieres agregar a esta meta? (CLP)')
    if (!input || isNaN(Number(input))) return
    const newAmount = Math.min(target, current + Number(input))
    const supabase = createClient()
    await supabase.from('saving_goals').update({ current_amount: newAmount }).eq('id', goalId)
    loadGoals()
  }

  async function deleteGoal(id: string) {
    const supabase = createClient()
    await supabase.from('saving_goals').delete().eq('id', id)
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-semibold text-[#E8E9F0] tracking-tight">Metas de ahorro</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Define y sigue el avance de tus metas</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Nueva meta</Button>
      </div>

      {showForm && (
        <div className="card p-6 animate-fade-up">
          <h3 className="text-sm font-semibold text-[#E8E9F0] mb-5">Nueva meta de ahorro</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              id="name"
              label="¿Para qué quieres ahorrar?"
              placeholder="Vacaciones, auto, fondo de emergencia..."
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="target"
                type="number"
                label="Monto objetivo (CLP)"
                placeholder="1000000"
                value={form.target_amount}
                onChange={(e) => setForm((p) => ({ ...p, target_amount: e.target.value }))}
                required
              />
              <Input
                id="deadline"
                type="date"
                label="Fecha límite"
                value={form.deadline}
                onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" loading={saving}>Crear meta</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-sm text-[#787774]">Cargando...</div>
      ) : goals.length === 0 ? (
        <div className="card p-12 text-center animate-fade-up">
          <div className="w-12 h-12 bg-[#6366F1]/10 rounded-[12px] flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="1.75">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[#E8E9F0] mb-1">Aún no tienes metas</p>
          <p className="text-xs text-[#6B7280]">Crea tu primera meta de ahorro y empieza a avanzar.</p>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-up animate-fade-up-delay-1">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100))
            const remaining = g.target_amount - g.current_amount
            const deadline = new Date(g.deadline)
            const today = new Date()
            const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            return (
              <div key={g.id} className="card card-hover p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#E8E9F0]">{g.name}</h3>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      {daysLeft > 0 ? `${daysLeft} días restantes` : 'Plazo vencido'}
                      {' · '}Faltan {formatCurrency(remaining)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => addAmount(g.id, g.current_amount, g.target_amount)}>
                      Agregar
                    </Button>
                    <button
                      onClick={() => deleteGoal(g.id)}
                      className="text-[#AEACA9] hover:text-[#9F2F2D] transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-[#6B7280]">{formatCurrency(g.current_amount)} ahorrado</p>
                  <p className="text-xs font-medium text-[#818CF8]">{pct}%</p>
                </div>
                <div className="h-2 bg-[#1E2028] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#6366F1] rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-[#3D4051]">$0</p>
                  <p className="text-xs text-[#3D4051]">{formatCurrency(g.target_amount)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
