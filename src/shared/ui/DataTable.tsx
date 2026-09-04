import { ReactNode } from 'react'

export interface DataTableColumn<T> {
  header: string
  accessor: (row: T) => ReactNode
  className?: string
  align?: 'left' | 'right'
}

export function DataTable<T>({
  columns,
  rows,
  keyOf,
  onRowClick,
  loading = false,
  emptyLabel = 'Нет данных',
  loadingLabel = 'Загрузка…',
}: {
  columns: DataTableColumn<T>[]
  rows: T[]
  keyOf: (row: T) => string
  onRowClick?: (row: T) => void
  loading?: boolean
  emptyLabel?: string
  loadingLabel?: string
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-surface">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-border bg-surface-muted">
            {columns.map((col) => (
              <th
                key={col.header}
                className={`px-4 py-2.5 font-medium text-muted ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={keyOf(row)}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-border last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-surface-muted/60' : ''}`}
            >
              {columns.map((col) => (
                <td
                  key={col.header}
                  className={`px-4 py-2.5 ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.className ?? ''}`}
                >
                  {col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted">
                {loading ? loadingLabel : emptyLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
