import { ReactNode } from 'react'

export interface KanbanColumn<K extends string> {
  key: K
  label: string
  hint?: string
}

export function KanbanBoard<T, K extends string>({
  columns,
  items,
  columnOf,
  keyOf,
  renderCard,
  onCardClick,
}: {
  columns: KanbanColumn<K>[]
  items: T[]
  columnOf: (item: T) => K
  keyOf: (item: T) => string
  renderCard: (item: T) => ReactNode
  onCardClick?: (item: T) => void
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {columns.map((column) => {
        const columnItems = items.filter((item) => columnOf(item) === column.key)
        return (
          <div key={column.key} className="flex w-72 shrink-0 flex-col">
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h3 className="text-[13px] font-medium text-ink">{column.label}</h3>
              <span className="tabular text-[12px] text-muted">{columnItems.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {columnItems.map((item) => (
                <button
                  key={keyOf(item)}
                  type="button"
                  onClick={() => onCardClick?.(item)}
                  className="rounded-md border border-border bg-surface p-3 text-left transition-colors hover:border-brand/40"
                >
                  {renderCard(item)}
                </button>
              ))}
              {columnItems.length === 0 && (
                <div className="rounded-md border border-dashed border-border p-3 text-center text-[12px] text-muted">
                  Пусто
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
