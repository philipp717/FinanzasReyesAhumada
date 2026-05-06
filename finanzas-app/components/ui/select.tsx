import { cn } from '@/lib/utils'
import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={cn(
          'w-full h-10 px-3 text-sm bg-[#1A1B23] border border-[#2A2B35] rounded-[8px] text-[#E8E9F0] transition-all duration-150 focus:border-[#6366F1] appearance-none cursor-pointer',
          error && 'border-[#EF4444]',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#1A1B23]">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-[#F87171]">{error}</p>}
    </div>
  )
)

Select.displayName = 'Select'
export { Select }
