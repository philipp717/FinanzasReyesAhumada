import { cn, formatCurrency } from '@/lib/utils'

interface StatsCardProps {
  title: string
  amount: number
  subtitle?: string
  variant?: 'default' | 'income' | 'expense' | 'savings'
  className?: string
}

const styles = {
  default:  { bg: '#13141A', border: '#1E2028', text: '#E8E9F0', sub: '#6B7280', label: '#6B7280' },
  income:   { bg: '#0D2E22', border: 'rgba(16,185,129,0.2)', text: '#34D399', sub: '#10B981', label: '#10B981' },
  expense:  { bg: '#2D1515', border: 'rgba(239,68,68,0.2)', text: '#F87171', sub: '#EF4444', label: '#EF4444' },
  savings:  { bg: '#1A1B35', border: 'rgba(99,102,241,0.2)', text: '#818CF8', sub: '#6366F1', label: '#6366F1' },
}

export function StatsCard({ title, amount, subtitle, variant = 'default', className }: StatsCardProps) {
  const s = styles[variant]
  return (
    <div className={cn('p-5 rounded-[12px]', className)}
      style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] mb-3" style={{ color: s.label }}>
        {title}
      </p>
      <p className="text-2xl font-semibold tracking-tight" style={{ color: s.text }}>
        {formatCurrency(amount)}
      </p>
      {subtitle && <p className="text-xs mt-1" style={{ color: s.sub }}>{subtitle}</p>}
    </div>
  )
}
