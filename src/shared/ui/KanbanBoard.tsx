import { ReactNode, useState } from 'react'
import { ChevronDown } from 'lucide-react'

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
  const [openKey, setOpenKey] = useState<K | null>(columns[0]?.key ?? null)

  const columnsWithItems = columns.map((column) => ({
    column,
    columnItems: items.filter((item) => columnOf(item) === column.key),
  }))

  const renderCards = (columnItems: T[]) => (
    <>
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
    </>
  )

  return (
    <>
      <div className="hidden gap-4 overflow-x-auto pb-2 sm:flex">
        {columnsWithItems.map(({ column, columnItems }) => (
          <div key={column.key} className="flex w-72 shrink-0 flex-col">
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h3 className="text-[13px] font-medium text-ink">{column.label}</h3>
              <span className="tabular text-[12px] text-muted">{columnItems.length}</span>
            </div>
            <div className="flex flex-col gap-2">{renderCards(columnItems)}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:hidden">
        {columnsWithItems.map(({ column, columnItems }) => {
          const isOpen = openKey === column.key
          return (
            <div key={column.key} className="rounded-md border border-border bg-surface">
              <button
                type="button"
                onClick={() => setOpenKey(isOpen ? null : column.key)}
                className="flex w-full items-center justify-between px-3 py-3"
                aria-expanded={isOpen}
              >
                <span className="text-[13px] font-medium text-ink">{column.label}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular text-[12px] text-muted">{columnItems.length}</span>
                  <ChevronDown
                    size={16}
                    className={`text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </span>
              </button>
              {isOpen && (
                <div className="flex flex-col gap-2 border-t border-border p-3 pt-2">
                  {renderCards(columnItems)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
