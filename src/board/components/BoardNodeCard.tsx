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
  /** Множитель размера относительно обычной ноды 2-го уровня — durov.house и направления крупнее. */
  scale?: number
}

export const BoardNodeCard = forwardRef<HTMLButtonElement, BoardNodeCardProps>(function BoardNodeCard(
  { node, active, selected, onClick, scale = 1 },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`relative z-10 flex w-full items-center rounded-md border bg-surface text-left shadow-sm transition-colors ${
        active
          ? 'board-node-active border-brand ring-2 ring-brand'
          : selected
            ? 'border-brand/50'
            : 'border-border hover:border-brand/40'
      }`}
      style={{ gap: 8 * scale, padding: `${10 * scale}px ${12 * scale}px` }}
    >
      <span
        className={`shrink-0 rounded-full ${DOT_CLASS[node.color]}`}
        style={{ width: 8 * scale, height: 8 * scale }}
        aria-hidden
      />
      <span className="truncate font-medium text-ink" style={{ fontSize: 13 * scale }}>
        {node.title}
      </span>
    </button>
  )
})
