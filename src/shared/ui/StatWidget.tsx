import { ReactNode } from 'react'
import { ChipTone } from './Chip'

const toneClasses: Record<ChipTone, string> = {
  neutral: 'text-ink',
  brand: 'text-brand-dark',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
}

export function StatWidget({
  label,
  value,
  hint,
  tone = 'neutral',
  icon,
}: {
  label: string
  value: ReactNode
  hint?: string
  tone?: ChipTone
  icon?: ReactNode
}) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="flex items-center justify-between text-[13px] text-muted">
        {label}
        {icon}
      </div>
      <div className={`tabular mt-1.5 text-[26px] font-medium leading-none ${toneClasses[tone]}`}>
        {value}
      </div>
      {hint && <div className="mt-1.5 text-[12px] text-muted">{hint}</div>}
    </div>
  )
}
