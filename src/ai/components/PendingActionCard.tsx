import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { PendingActionOut } from '../types'

function formatInput(input: Record<string, unknown>): { key: string; value: string }[] {
  return Object.entries(input).map(([key, value]) => ({
    key,
    value: typeof value === 'string' ? value : JSON.stringify(value),
  }))
}

export function PendingActionCard({
  action,
  onResolve,
}: {
  action: PendingActionOut
  onResolve: (id: number, decision: 'approve' | 'reject') => Promise<unknown>
}) {
  const [deciding, setDeciding] = useState<'approve' | 'reject' | null>(null)
  const fields = formatInput(action.tool_input)

  async function decide(decision: 'approve' | 'reject') {
    setDeciding(decision)
    await onResolve(action.id, decision)
    setDeciding(null)
  }

  return (
    <div className="w-full max-w-[85%] rounded-md border border-border bg-surface-muted p-3 sm:max-w-md">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-ink">{action.tool_name}</span>
        {action.status === 'pending' ? (
          <Chip tone="warning">Ожидает</Chip>
        ) : action.status === 'approved' ? (
          <Chip tone="success">Одобрено</Chip>
        ) : (
          <Chip tone="danger">Отклонено</Chip>
        )}
      </div>
      {fields.length > 0 && (
        <dl className="mb-2 flex flex-col gap-1">
          {fields.map(({ key, value }) => (
            <div key={key} className="flex min-w-0 gap-2 text-[12px]">
              <dt className="shrink-0 text-muted">{key}:</dt>
              <dd className="min-w-0 truncate text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {action.status === 'pending' && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => decide('approve')} disabled={deciding !== null}>
            <Check size={14} />
            {deciding === 'approve' ? 'Одобряем…' : 'Одобрить'}
          </Button>
          <Button size="sm" variant="danger" onClick={() => decide('reject')} disabled={deciding !== null}>
            <X size={14} />
            {deciding === 'reject' ? 'Отклоняем…' : 'Отклонить'}
          </Button>
        </div>
      )}
    </div>
  )
}
