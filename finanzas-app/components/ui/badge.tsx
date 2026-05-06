import { cn } from '@/lib/utils'

interface BadgeProps {
  label: string
  variant?: 'green' | 'blue' | 'yellow' | 'red' | 'neutral'
  className?: string
}

const variantStyles = {
  green:   'bg-[#0D2E22] text-[#34D399] border border-[#10B981]/20',
  blue:    'bg-[#1A1B35] text-[#818CF8] border border-[#6366F1]/20',
  yellow:  'bg-[#2D2010] text-[#FCD34D] border border-[#F59E0B]/20',
  red:     'bg-[#2D1515] text-[#F87171] border border-[#EF4444]/20',
  neutral: 'bg-[#1A1B23] text-[#6B7280] border border-[#2A2B35]',
}

export function Badge({ label, variant = 'neutral', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-[0.06em]',
      variantStyles[variant],
      className
    )}>
      {label}
    </span>
  )
}
