import { ArrowRight } from 'lucide-react'
import { AktualnoeItem } from '../types'

/**
 * Цвет прогресс-бара плавно едет от красного к жёлтому и зелёному по значению
 * percent: hue 0° (красный) → ~130° (зелёный), жёлтый проходит около середины.
 */
function barColor(percent: number): string {
  const p = Math.max(0, Math.min(100, percent)) / 100
  const hue = Math.round(p * 130)
  return `hsl(${hue} 78% 44%)`
}

interface Props {
  item: AktualnoeItem
  onClick?: () => void
}

export function AktualnoeCard({ item, onClick }: Props) {
  const percent = Math.max(0, Math.min(100, Math.round(item.percent)))
  const color = barColor(percent)

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col gap-3 rounded-xl border border-border bg-bg px-4 py-3.5 text-left transition-colors hover:border-brand/40 hover:bg-surface-muted/60"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="block truncate text-[14px] font-medium text-ink">{item.client_name}</span>
          <span className="mt-0.5 block truncate text-[12px] text-muted">{item.stage}</span>
        </div>
        <ArrowRight size={16} className="mt-0.5 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand" />
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="truncate text-[12px] text-ink">{item.phrase || 'В работе'}</span>
          <span className="shrink-0 text-[12px] font-semibold tabular text-muted">{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-pill bg-surface-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-pill transition-[width,background-color] duration-500" style={{ width: `${percent}%`, backgroundColor: color }} />
        </div>
      </div>
    </button>
  )
}
