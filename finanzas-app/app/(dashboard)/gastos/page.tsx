'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateShort, CATEGORY_LABELS, PAYMENT_LABELS, getCurrentMonth } from '@/lib/utils'
import type { Transaction, TransactionType, SavingGoal } from '@/types'

const GASTO_CATEGORIES = [
  { value: 'supermercado', label: 'Supermercado' },
  { value: 'mercaderia', label: 'Mercadería' },
  { value: 'ropa', label: 'Ropa' },
  { value: 'salud', label: 'Salud' },
  { value: 'educacion', label: 'Educación' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'servicios', label: 'Servicios básicos' },
  { value: 'arriendo', label: 'Arriendo / Dividendo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'mascotas', label: 'Mascotas' },
  { value: 'entretenimiento', label: 'Entretenimiento' },
  { value: 'otro', label: 'Otro' },
]

const DEUDA_CATEGORIES = [
  { value: 'tarjeta_credito', label: 'Tarjeta de crédito' },
  { value: 'credito_bancario', label: 'Crédito bancario' },
  { value: 'deuda_efectivo', label: 'Deuda en efectivo' },
  { value: 'prestamo_personal', label: 'Préstamo personal' },
  { value: 'cuota_auto', label: 'Cuota de auto' },
  { value: 'arriendo_atrasado', label: 'Arriendo atrasado' },
  { value: 'deuda_servicios', label: 'Deuda de servicios' },
  { value: 'otro_deuda', label: 'Otra deuda' },
]

const GASTO_PAYMENTS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
  { value: 'transferencia', label: 'Transferencia' },
]

const AHORRO_PAYMENTS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'cuenta_ahorro', label: 'Cuenta de ahorro' },
]

const DEUDA_PAYMENTS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'debito', label: 'Débito' },
  { value: 'transferencia', label: 'Transferencia bancaria' },
  { value: 'cheque', label: 'Cheque' },
]

type TypeCard = { value: TransactionType; label: string; desc: string; color: string; bgColor: string; borderColor: string }
const TYPE_CARDS: TypeCard[] = [
  { value: 'gasto',   label: 'Gasto',   desc: 'Un pago o compra',           color: '#F87171', bgColor: '#2D1515', borderColor: 'rgba(248,113,113,0.2)' },
  { value: 'ingreso', label: 'Ingreso', desc: 'Sueldo u otro ingreso',       color: '#34D399', bgColor: '#0D2E22', borderColor: 'rgba(52,211,153,0.2)' },
  { value: 'ahorro',  label: 'Ahorro',  desc: 'Aporte a una meta de ahorro', color: '#818CF8', bgColor: '#1A1B38', borderColor: 'rgba(99,102,241,0.2)' },
  { value: 'deuda',   label: 'Deuda',   desc: 'Pago de deuda o crédito',     color: '#FCD34D', bgColor: '#2D2010', borderColor: 'rgba(252,211,77,0.2)' },
]

function getDefaultsForType(type: TransactionType) {
  if (type === 'gasto')   return { category: 'otro', payment_method: 'debito' }
  if (type === 'ingreso') return { category: 'sueldo', payment_method: '' }
  if (type === 'ahorro')  return { category: 'otro', payment_method: 'efectivo' }
  if (type === 'deuda')   return { category: 'tarjeta_credito', payment_method: 'efectivo' }
  return { category: 'otro', payment_method: 'debito' }
}

const emptyForm = {
  type: '' as TransactionType | '',
  amount: '', category: '', description: '', payment_method: '',
  date: new Date().toISOString().split('T')[0],
  goal_id: '', new_goal_name: '', new_goal_amount: '', new_goal_deadline: '',
}

// ─── Receipt viewer modal ────────────────────────────────────────────────────

function ReceiptModal({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full rounded-[16px] overflow-hidden"
        style={{ background: '#13141A', border: '1px solid #1E2028' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1E2028' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[6px] bg-[#6366F1]/10 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#E8E9F0]">Comprobante</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#818CF8] hover:text-[#6366F1] transition-colors"
            >
              Ver completo ↗
            </a>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded-[4px] text-[#6B7280] hover:text-[#E8E9F0] hover:bg-[#1E2028] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-2 max-h-[70vh] overflow-auto">
          <img src={url} alt="Comprobante" className="w-full rounded-[8px]" />
        </div>
        <div className="px-4 py-2 flex items-center gap-1.5" style={{ borderTop: '1px solid #1E2028' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-[10px] text-[#6B7280]">Comprobante guardado en Fami</p>
        </div>
      </div>
    </div>
  )
}

// ─── Toast de nueva transacción en tiempo real ───────────────────────────────

function LiveToast({ tx, onDismiss }: { tx: Transaction; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-start gap-3 px-4 py-3 rounded-[12px] shadow-2xl animate-fade-up"
      style={{ background: '#0D2E22', border: '1px solid rgba(52,211,153,0.3)', maxWidth: 300 }}>
      <span className="text-lg shrink-0">📲</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#34D399]">Nueva transacción desde WhatsApp</p>
        <p className="text-xs text-[#6B7280] mt-0.5 truncate">
          {CATEGORY_LABELS[tx.category] ?? tx.category} · {formatCurrency(tx.amount)}
        </p>
      </div>
      <button onClick={onDismiss} className="text-[#6B7280] hover:text-[#E8E9F0] shrink-0 mt-0.5">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
          <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GastosPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<SavingGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState<string>('todos')
  const [form, setForm] = useState(emptyForm)
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
  const [liveToast, setLiveToast] = useState<Transaction | null>(null)
  const userIdRef = useRef<string | null>(null)

  const loadTransactions = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    userIdRef.current = user.id
    const { start, end } = getCurrentMonth()
    const { data } = await supabase
      .from('transactions').select('*').eq('user_id', user.id)
      .gte('date', start).lte('date', end).order('date', { ascending: false })
    setTransactions(data ?? [])
    setLoading(false)
  }, [])

  const loadGoals = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('saving_goals').select('*').eq('user_id', user.id)
    setGoals(data ?? [])
  }, [])

  // Supabase Realtime subscription — live updates from WhatsApp bot
  useEffect(() => {
    const supabase = createClient()
    loadTransactions()
    loadGoals()

    let channel: ReturnType<typeof supabase.channel> | null = null

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      userIdRef.current = user.id
      const { start, end } = getCurrentMonth()

      channel = supabase
        .channel('transactions-live')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
          (payload) => {
            const newTx = payload.new as Transaction
            if (newTx.date >= start && newTx.date <= end) {
              setTransactions(prev => {
                if (prev.some(t => t.id === newTx.id)) return prev
                return [newTx, ...prev]
              })
              // Show toast only for WhatsApp-sourced transactions
              if (newTx.payment_method === 'whatsapp') {
                setLiveToast(newTx)
              }
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
          (payload) => {
            setTransactions(prev => prev.filter(t => t.id !== (payload.old as Transaction).id))
          }
        )
        .subscribe()
    })

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [loadTransactions, loadGoals])

  function openForm() {
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] })
    setShowForm(true)
  }

  function selectType(type: TransactionType) {
    const defaults = getDefaultsForType(type)
    setForm(p => ({ ...p, type, category: defaults.category, payment_method: defaults.payment_method, goal_id: '', new_goal_name: '', new_goal_amount: '', new_goal_deadline: '' }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.type) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const type = form.type as TransactionType

    if (type === 'ahorro') {
      if (form.goal_id === 'new' && form.new_goal_name) {
        const deadline = form.new_goal_deadline || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
        await supabase.from('saving_goals').insert({
          user_id: user.id, name: form.new_goal_name,
          target_amount: Number(form.new_goal_amount) || 0,
          current_amount: Number(form.amount) || 0, deadline,
        })
      } else if (form.goal_id) {
        const goal = goals.find(g => g.id === form.goal_id)
        if (goal) {
          const newAmount = Math.min(goal.target_amount, goal.current_amount + Number(form.amount))
          await supabase.from('saving_goals').update({ current_amount: newAmount }).eq('id', form.goal_id)
        }
      }
    }

    const category = type === 'ingreso' ? 'sueldo' : (form.category || 'otro')
    const paymentMethod = type === 'ingreso' ? 'transferencia' : (form.payment_method || 'efectivo')

    await supabase.from('transactions').insert({
      user_id: user.id, type, amount: Number(form.amount),
      category, description: form.description,
      payment_method: paymentMethod, date: form.date,
    })

    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] })
    setShowForm(false)
    setSaving(false)
    if (type === 'ahorro') loadGoals()
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const filtered = filterType === 'todos' ? transactions : transactions.filter(t => t.type === filterType)
  const totalGastos = transactions.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0)
  const totalIngresos = transactions.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
  const activeCard = TYPE_CARDS.find(c => c.value === form.type)

  return (
    <div className="space-y-6">
      {/* Receipt modal */}
      {selectedReceipt && <ReceiptModal url={selectedReceipt} onClose={() => setSelectedReceipt(null)} />}

      {/* Live toast */}
      {liveToast && <LiveToast tx={liveToast} onDismiss={() => setLiveToast(null)} />}

      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-semibold text-[#E8E9F0] tracking-tight">Transacciones</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Registro de este mes</p>
        </div>
        <Button onClick={openForm}>+ Nueva transacción</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 animate-fade-up animate-fade-up-delay-1">
        <div className="card p-4 bg-[#0D2E22]">
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-[#34D399]/70 mb-1">Ingresos del mes</p>
          <p className="text-xl font-semibold text-[#34D399]">{formatCurrency(totalIngresos)}</p>
        </div>
        <div className="card p-4 bg-[#2D1515]">
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-[#F87171]/70 mb-1">Gastos del mes</p>
          <p className="text-xl font-semibold text-[#F87171]">{formatCurrency(totalGastos)}</p>
        </div>
      </div>

      {showForm && (
        <div className="card p-6 animate-fade-up">
          {!form.type ? (
            <>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-[#E8E9F0]">¿Qué tipo de transacción?</h3>
                <button onClick={() => setShowForm(false)} className="text-xs text-[#6B7280] hover:text-[#E8E9F0] transition-colors">Cancelar</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {TYPE_CARDS.map(({ value, label, desc, color, bgColor, borderColor }) => (
                  <button key={value} onClick={() => selectType(value)}
                    className="text-left p-4 rounded-[10px] border transition-all duration-150 hover:scale-[1.02] active:scale-100"
                    style={{ background: bgColor, borderColor }}>
                    <p className="text-sm font-semibold mb-1" style={{ color }}>{label}</p>
                    <p className="text-xs text-[#6B7280]">{desc}</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  {activeCard && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: activeCard.bgColor, color: activeCard.color, border: `1px solid ${activeCard.borderColor}` }}>
                      {activeCard.label}
                    </span>
                  )}
                  <button onClick={() => setForm(p => ({ ...p, type: '' }))} className="text-xs text-[#6B7280] hover:text-[#E8E9F0] transition-colors">
                    Cambiar tipo
                  </button>
                </div>
                <button onClick={() => setShowForm(false)} className="text-xs text-[#6B7280] hover:text-[#E8E9F0] transition-colors">Cancelar</button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input id="amount" type="number" label="Monto (CLP)" placeholder="50000"
                    value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required />
                  <Input id="date" type="date" label="Fecha" value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
                </div>

                {form.type === 'gasto' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Select id="category" label="Categoría" options={GASTO_CATEGORIES}
                      value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
                    <Select id="payment" label="Medio de pago" options={GASTO_PAYMENTS}
                      value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))} />
                  </div>
                )}

                {form.type === 'ahorro' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Select id="payment" label="Medio de pago" options={AHORRO_PAYMENTS}
                        value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))} />
                      <div>
                        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Meta de ahorro</label>
                        <select className="w-full h-10 px-3 text-sm rounded-[8px] outline-none"
                          style={{ background: '#13141A', border: '1px solid #1E2028', color: '#E8E9F0' }}
                          value={form.goal_id} onChange={e => setForm(p => ({ ...p, goal_id: e.target.value }))}>
                          <option value="">Sin meta asociada</option>
                          {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                          <option value="new">+ Crear nueva meta</option>
                        </select>
                      </div>
                    </div>
                    {form.goal_id === 'new' && (
                      <div className="space-y-3 p-4 rounded-[10px] border border-[#6366F1]/20 bg-[#1A1B38]">
                        <p className="text-xs font-semibold text-[#818CF8]">Nueva meta de ahorro</p>
                        <Input id="new_goal_name" label="¿Para qué quieres ahorrar?"
                          placeholder="Vacaciones, auto, fondo de emergencia..."
                          value={form.new_goal_name} onChange={e => setForm(p => ({ ...p, new_goal_name: e.target.value }))} />
                        <div className="grid grid-cols-2 gap-3">
                          <Input id="new_goal_amount" type="number" label="Monto objetivo (CLP)"
                            placeholder="1000000" value={form.new_goal_amount}
                            onChange={e => setForm(p => ({ ...p, new_goal_amount: e.target.value }))} />
                          <Input id="new_goal_deadline" type="date" label="Fecha límite"
                            value={form.new_goal_deadline} onChange={e => setForm(p => ({ ...p, new_goal_deadline: e.target.value }))} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {form.type === 'deuda' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Select id="category" label="Tipo de deuda" options={DEUDA_CATEGORIES}
                      value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
                    <Select id="payment" label="Medio de pago" options={DEUDA_PAYMENTS}
                      value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))} />
                  </div>
                )}

                <Input id="description" label="Descripción (opcional)"
                  placeholder={
                    form.type === 'ingreso' ? 'Sueldo de mayo...' :
                    form.type === 'ahorro' ? 'Aporte mensual...' :
                    form.type === 'deuda' ? 'Cuota #3 del crédito...' : 'Compras del mes...'
                  }
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />

                <div className="flex gap-2 pt-2">
                  <Button type="submit" loading={saving}>Guardar</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      <div className="flex gap-2 animate-fade-up animate-fade-up-delay-2">
        {['todos', 'gasto', 'ingreso', 'ahorro', 'deuda'].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium capitalize transition-colors duration-150 ${
              filterType === t ? 'bg-[#6366F1] text-white' : 'text-[#6B7280] hover:text-[#E8E9F0] hover:bg-[#1A1B23]'
            }`}>
            {t}
          </button>
        ))}
      </div>

      <div className="card animate-fade-up animate-fade-up-delay-3">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#787774]">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#787774]">No hay transacciones registradas.</div>
        ) : (
          <div className="divide-y divide-[#1E2028]">
            {filtered.map(t => (
              <div key={t.id} className="px-5 py-3.5 flex items-center justify-between group">
                <div className="min-w-0 flex-1 mr-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-[#E8E9F0] truncate">
                      {t.description || CATEGORY_LABELS[t.category] || t.category}
                    </p>
                    {t.receipt_url && (
                      <button
                        onClick={() => setSelectedReceipt(t.receipt_url!)}
                        className="shrink-0 w-5 h-5 rounded-[4px] bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center hover:bg-[#6366F1]/20 transition-colors"
                        title="Ver comprobante"
                      >
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </button>
                    )}
                    {t.payment_method === 'whatsapp' && (
                      <span className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#0D2E22] text-[#34D399] border border-[#34D399]/20">
                        WA
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-[#6B7280]">{formatDateShort(t.date)}</p>
                    <span className="text-xs text-[#3D4051]">·</span>
                    <p className="text-xs text-[#6B7280]">{CATEGORY_LABELS[t.category] ?? t.category}</p>
                    <span className="text-xs text-[#3D4051]">·</span>
                    <p className="text-xs text-[#3D4051]">{PAYMENT_LABELS[t.payment_method] ?? t.payment_method}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    label={t.type}
                    variant={t.type === 'ingreso' ? 'green' : t.type === 'ahorro' ? 'blue' : t.type === 'deuda' ? 'red' : 'yellow'}
                  />
                  <span className={`text-sm font-medium min-w-[80px] text-right ${t.type === 'ingreso' ? 'text-[#34D399]' : 'text-[#E8E9F0]'}`}>
                    {t.type === 'ingreso' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                  <button onClick={() => handleDelete(t.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#AEACA9] hover:text-[#9F2F2D]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                      <path d="M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
