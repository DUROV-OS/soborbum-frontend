import { forwardRef } from 'react'
import { BoardNode } from '../types'

export const DOT_CLASS: Record<BoardNode['color'], string> = {
  green: 'bg-success',
  yellow: 'bg-warning',
  red: 'bg-danger',
}

interface BoardNodeCardProps {
  node: BoardNode
  active: boolean
  selected: boolean
  onClick: () => void
}

export const BoardNodeCard = forwardRef<HTMLButtonElement, BoardNodeCardProps>(function BoardNodeCard(
  { node, active, selected, onClick },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`relative z-10 flex w-full items-center gap-2 rounded-md border bg-surface px-3 py-2.5 text-left shadow-sm transition-colors ${
        active
          ? 'board-node-active border-brand ring-2 ring-brand'
          : selected
            ? 'border-brand/50'
            : 'border-border hover:border-brand/40'
      }`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_CLASS[node.color]}`} aria-hidden />
      <span className="truncate text-[13px] font-medium text-ink">{node.title}</span>
    </button>
  )
})
