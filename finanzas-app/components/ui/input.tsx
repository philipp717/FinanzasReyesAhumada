import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full h-10 px-3 text-sm bg-[#1A1B23] border border-[#2A2B35] rounded-[8px] text-[#E8E9F0] placeholder:text-[#3D4051] transition-all duration-150 focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/30',
          error && 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-[#6B7280]">{hint}</p>}
      {error && <p className="text-xs text-[#F87171]">{error}</p>}
    </div>
  )
)

Input.displayName = 'Input'
export { Input }
