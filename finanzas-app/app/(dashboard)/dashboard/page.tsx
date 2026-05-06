import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatsCard } from '@/components/dashboard/stats-card'
import { IncomeExpenseChart, CategoryPieChart, SavingsBarChart } from '@/components/dashboard/charts'
import { formatCurrency, formatDateShort, CATEGORY_LABELS, getCurrentMonth } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Transaction } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { start, end } = getCurrentMonth()

  const [{ data: transactions }, { data: profile }, { data: goals }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('saving_goals').select('*').eq('user_id', user.id),
  ])

  const txs: Transaction[] = transactions ?? []

  const totalIncome = txs.filter((t) => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = txs.filter((t) => t.type === 'gasto').reduce((s, t) => s + t.amount, 0)
  const totalSavings = txs.filter((t) => t.type === 'ahorro').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpenses - totalSavings

  const categoryMap: Record<string, number> = {}
  txs.filter((t) => t.type === 'gasto').forEach((t) => {
    categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.amount
  })
  const categoryData = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)

  const monthlyData = [
    { month: 'Ene', ingresos: 0, gastos: 0, ahorro: 0 },
    { month: 'Feb', ingresos: 0, gastos: 0, ahorro: 0 },
    { month: 'Mar', ingresos: 0, gastos: 0, ahorro: 0 },
    { month: 'Abr', ingresos: 0, gastos: 0, ahorro: 0 },
    { month: 'May', ingresos: totalIncome, gastos: totalExpenses, ahorro: totalSavings },
    { month: 'Jun', ingresos: 0, gastos: 0, ahorro: 0 },
  ]

  const firstName = profile?.full_name?.split(' ')[0] ?? 'usuario'
  const recentTxs = txs.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-semibold text-[#E8E9F0] tracking-tight mb-0.5">
          Hola, {firstName}
        </h1>
        <p className="text-sm text-[#6B7280]">Aquí está el resumen de {new Date().toLocaleString('es-CL', { month: 'long' })}.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-up animate-fade-up-delay-1">
        <StatsCard title="Ingresos" amount={totalIncome} variant="income" subtitle="Este mes" />
        <StatsCard title="Gastos" amount={totalExpenses} variant="expense" subtitle="Este mes" />
        <StatsCard title="Ahorro" amount={totalSavings} variant="savings" subtitle="Este mes" />
        <StatsCard title="Saldo disponible" amount={balance} subtitle="Ingresos − Gastos − Ahorro" />
      </div>

      {/* Alert if overspending */}
      {totalExpenses > totalIncome * 0.8 && totalIncome > 0 && (
        <div className="bg-[#2D2010] border border-[#FCD34D]/20 rounded-[8px] px-4 py-3 flex items-start gap-3 animate-fade-up">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FCD34D" strokeWidth="1.75" className="mt-0.5 shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
            <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-[#FCD34D]">Tus gastos superan el 80% de tus ingresos este mes.</p>
            <p className="text-xs text-[#FCD34D]/70 mt-0.5">Considera revisar tus gastos con el asistente Fina.</p>
          </div>
        </div>
      )}

      {/* Saving goals */}
      {goals && goals.length > 0 && (
        <div className="card p-5 animate-fade-up animate-fade-up-delay-2">
          <h3 className="text-sm font-semibold text-[#E8E9F0] mb-4">Metas de ahorro</h3>
          <div className="space-y-4">
            {goals.map((g) => {
              const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100))
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm text-[#E8E9F0]">{g.name}</p>
                    <p className="text-xs text-[#6B7280]">{formatCurrency(g.current_amount)} / {formatCurrency(g.target_amount)}</p>
                  </div>
                  <div className="h-1.5 bg-[#1E2028] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6366F1] rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#6B7280] mt-1">{pct}% completado</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up animate-fade-up-delay-2">
        <IncomeExpenseChart data={monthlyData} />
        {categoryData.length > 0
          ? <CategoryPieChart data={categoryData} />
          : <div className="card p-6 flex items-center justify-center text-sm text-[#787774]">Sin gastos registrados aún.</div>
        }
      </div>

      <SavingsBarChart data={monthlyData} />

      {/* Recent transactions */}
      <div className="card animate-fade-up animate-fade-up-delay-3">
        <div className="px-5 py-4 border-b border-[#1E2028]">
          <h3 className="text-sm font-semibold text-[#E8E9F0]">Últimas transacciones</h3>
        </div>
        {recentTxs.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-[#6B7280]">
            Aún no hay transacciones. Agrega tu primer gasto o ingreso.
          </div>
        ) : (
          <div className="divide-y divide-[#1E2028]">
            {recentTxs.map((t) => (
              <div key={t.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#E8E9F0]">{t.description || CATEGORY_LABELS[t.category] || t.category}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{formatDateShort(t.date)} · {CATEGORY_LABELS[t.category] ?? t.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    label={t.type}
                    variant={t.type === 'ingreso' ? 'green' : t.type === 'ahorro' ? 'blue' : t.type === 'deuda' ? 'red' : 'yellow'}
                  />
                  <span className={`text-sm font-medium ${t.type === 'ingreso' ? 'text-[#34D399]' : 'text-[#E8E9F0]'}`}>
                    {t.type === 'ingreso' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
