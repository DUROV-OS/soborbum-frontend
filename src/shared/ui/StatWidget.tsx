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
  onClick,
}: {
  label: string
  value: ReactNode
  hint?: string
  tone?: ChipTone
  icon?: ReactNode
  onClick?: () => void
}) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      className={`w-full rounded-md border border-border bg-surface p-4 text-left ${
        onClick ? 'transition-colors hover:border-brand/40' : ''
      }`}
      {...(onClick ? { type: 'button', onClick } : {})}
    >
      <div className="flex items-center justify-between text-[13px] text-muted">
        {label}
        {icon}
      </div>
      <div className={`tabular mt-1.5 text-[26px] font-medium leading-none ${toneClasses[tone]}`}>
        {value}
      </div>
      {hint && <div className="mt-1.5 text-[12px] text-muted">{hint}</div>}
    </Wrapper>
  )
}
