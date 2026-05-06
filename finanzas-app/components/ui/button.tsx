'use client'

import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'brand'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed select-none'

    const variants = {
      primary: 'bg-[#E8E9F0] text-[#0A0B0E] hover:bg-white active:scale-[0.98] rounded-[8px]',
      brand: 'bg-[#6366F1] text-white hover:bg-[#4F46E5] active:scale-[0.98] rounded-[8px] shadow-[0_0_20px_rgba(99,102,241,0.3)]',
      secondary: 'bg-[#1A1B23] text-[#E8E9F0] border border-[#2A2B35] hover:border-[#6366F1] hover:text-white active:scale-[0.98] rounded-[8px]',
      ghost: 'text-[#6B7280] hover:text-[#E8E9F0] hover:bg-[#1A1B23] rounded-[8px]',
      danger: 'bg-[#2D1515] text-[#F87171] border border-[#3D2020] hover:bg-[#3D2020] active:scale-[0.98] rounded-[8px]',
    }

    const sizes = {
      sm: 'text-xs px-3 py-1.5 h-7',
      md: 'text-sm px-4 py-2 h-9',
      lg: 'text-sm px-6 py-3 h-11',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {children}
          </span>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { Button }
