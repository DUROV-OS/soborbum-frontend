import { useEffect, useState } from 'react'
import { DataTable } from '@/shared/ui/DataTable'
import { Select } from '@/shared/ui/Field'
import * as warehouseApi from '../api'
import { useWarehouseStore } from '../store'
import { MOVEMENT_REASON_LABEL, MovementReason, StockMovement } from '../types'

export function MovementHistoryPanel() {
  const materials = useWarehouseStore((s) => s.materials)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [reason, setReason] = useState<MovementReason | 'all'>('all')

  useEffect(() => {
    warehouseApi.history(reason === 'all' ? {} : { reason }).then(setMovements)
  }, [reason])

  function materialTitle(id: number) {
    return materials.find((m) => m.id === id)?.title ?? `Материал №${id}`
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Select value={reason} onChange={(e) => setReason(e.target.value as MovementReason | 'all')} className="w-56">
          <option value="all">Все причины</option>
          {Object.entries(MOVEMENT_REASON_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <DataTable
        columns={[
          { header: 'Дата', accessor: (m) => new Date(m.created_at).toLocaleString('ru-RU') },
          { header: 'Материал', accessor: (m) => materialTitle(m.warehouse_material_id) },
          { header: 'Причина', accessor: (m) => MOVEMENT_REASON_LABEL[m.reason] },
          {
            header: 'Изменение',
            align: 'right',
            className: 'tabular',
            accessor: (m) => (
              <span className={m.delta >= 0 ? 'text-success' : 'text-danger'}>
                {m.delta >= 0 ? '+' : ''}
                {m.delta}
              </span>
            ),
          },
        ]}
        rows={movements}
        keyOf={(m) => String(m.id)}
        emptyLabel="Движений пока нет"
      />
    </div>
  )
}
