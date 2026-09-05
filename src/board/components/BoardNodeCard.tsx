import { forwardRef } from 'react'
import { BoardNode } from '../types'

const STATUS_BORDER_CLASS: Record<BoardNode['color'], string> = {
  green: 'border-success',
  yellow: 'border-warning',
  red: 'border-danger',
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
      className={`relative z-10 flex w-full items-center justify-center rounded-2xl border-2 bg-surface text-center shadow-sm transition-colors ${
        active
          ? 'board-node-active border-brand ring-2 ring-brand'
          : `${STATUS_BORDER_CLASS[node.color]} hover:border-brand/60 ${selected ? 'ring-2 ring-brand/40' : ''}`
      }`}
      style={{ padding: `${10 * scale}px ${12 * scale}px` }}
    >
      <span className="truncate font-medium text-ink" style={{ fontSize: 13 * scale }}>
        {node.title}
      </span>
    </button>
  )
})
