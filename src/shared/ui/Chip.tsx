import { ReactNode } from 'react'

export type ChipTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'

const toneClasses: Record<ChipTone, string> = {
  neutral: 'bg-surface-muted text-muted',
  brand: 'bg-brand/10 text-brand-dark',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
}

export function Chip({ tone = 'neutral', children }: { tone?: ChipTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-1 text-[12px] font-medium leading-none ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}
