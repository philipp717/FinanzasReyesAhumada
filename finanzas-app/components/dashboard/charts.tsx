'use client'

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { formatCurrency, CATEGORY_LABELS } from '@/lib/utils'

interface MonthlyData { month: string; ingresos: number; gastos: number; ahorro: number }
interface CategoryData { category: string; amount: number }

const CHART_COLORS = ['#818CF8', '#34D399', '#FCD34D', '#F87171', '#60A5FA', '#C084FC', '#6B7280']

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: {name: string; value: number; color: string}[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[8px] p-3 shadow-xl"
      style={{ background: '#1A1B23', border: '1px solid #2A2B35' }}>
      {label && <p className="text-xs font-medium text-[#E8E9F0] mb-1.5">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="text-xs text-[#6B7280]">
          <span style={{ color: p.color }}>■</span> {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

export function IncomeExpenseChart({ data }: { data: MonthlyData[] }) {
  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-[#E8E9F0] mb-0.5">Ingresos vs Gastos</h3>
      <p className="text-xs text-[#6B7280] mb-5">Últimos 6 meses</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2028" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10B981" strokeWidth={1.5} fill="url(#incG)" />
          <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#EF4444" strokeWidth={1.5} fill="url(#expG)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CategoryPieChart({ data }: { data: CategoryData[] }) {
  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-[#E8E9F0] mb-0.5">Gastos por categoría</h3>
      <p className="text-xs text-[#6B7280] mb-5">Este mes</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="amount" nameKey="category"
            cx="40%" cy="50%" innerRadius={55} outerRadius={80} strokeWidth={2} stroke="#0A0B0E">
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), CATEGORY_LABELS[String(name)] ?? name]} />
          <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={8}
            formatter={(v) => <span style={{ fontSize: 11, color: '#6B7280' }}>{CATEGORY_LABELS[v] ?? v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SavingsBarChart({ data }: { data: MonthlyData[] }) {
  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-[#E8E9F0] mb-0.5">Ahorro mensual</h3>
      <p className="text-xs text-[#6B7280] mb-5">Evolución del ahorro</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barSize={24}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2028" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="ahorro" name="Ahorro" fill="#6366F1" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
