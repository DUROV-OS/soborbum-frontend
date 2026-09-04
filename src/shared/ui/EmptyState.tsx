import { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border px-6 py-14 text-center">
      {icon && <div className="mb-3 text-muted">{icon}</div>}
      <div className="text-[14px] font-medium text-ink">{title}</div>
      {description && <div className="mt-1 max-w-sm text-[13px] text-muted">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
