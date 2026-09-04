import { useEffect, useState } from 'react'
import { Plus, Truck } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { DataTable } from '@/shared/ui/DataTable'
import { Tabs } from '@/shared/ui/Tabs'
import { useWarehouseStore } from '../store'
import { Material } from '../types'
import { CreateMaterialModal } from '../components/CreateMaterialModal'
import { SupplyIntakeModal } from '../components/SupplyIntakeModal'
import { MaterialDetailDrawer } from '../components/MaterialDetailDrawer'
import { RequestApprovalQueue } from '../components/RequestApprovalQueue'
import { MovementHistoryPanel } from '../components/MovementHistoryPanel'

type Tab = 'materials' | 'requests' | 'history'

export function WarehousePage() {
  const materials = useWarehouseStore((s) => s.materials)
  const load = useWarehouseStore((s) => s.load)
  const [tab, setTab] = useState<Tab>('materials')
  const [creatingMaterial, setCreatingMaterial] = useState(false)
  const [supplying, setSupplying] = useState(false)
  const [selected, setSelected] = useState<Material | null>(null)

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-ink">Склад</h1>
          <p className="mt-1 text-[13px] text-muted">Материалы, заявки от производства и история движения</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setCreatingMaterial(true)}>
            <Plus size={16} />
            Материал
          </Button>
          <Button onClick={() => setSupplying(true)}>
            <Truck size={16} />
            Оформить поставку
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Tabs
          tabs={[
            { key: 'materials', label: 'Материалы' },
            { key: 'requests', label: 'Заявки на проверку' },
            { key: 'history', label: 'История движения' },
          ]}
          activeKey={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'materials' && (
        <DataTable
          columns={[
            { header: 'Материал', accessor: (m) => <MaterialCell material={m} /> },
            { header: 'На складе', align: 'right', accessor: (m) => `${m.quantity_in_stock} ${m.unit}`, className: 'tabular' },
            { header: 'Запрошено', align: 'right', accessor: (m) => `${m.total_requested} ${m.unit}`, className: 'tabular' },
            { header: 'Порог', align: 'right', accessor: (m) => `${m.threshold} ${m.unit}`, className: 'tabular' },
            {
              header: 'Статус',
              accessor: (m) => (m.needs_supply ? <Chip tone="danger">Нужна поставка</Chip> : <Chip tone="success">В норме</Chip>),
            },
          ]}
          rows={materials}
          keyOf={(m) => String(m.id)}
          onRowClick={setSelected}
        />
      )}

      {tab === 'requests' && <RequestApprovalQueue />}
      {tab === 'history' && <MovementHistoryPanel />}

      <CreateMaterialModal open={creatingMaterial} onClose={() => setCreatingMaterial(false)} />
      <SupplyIntakeModal open={supplying} onClose={() => setSupplying(false)} />
      <MaterialDetailDrawer material={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function MaterialCell({ material }: { material: Material }) {
  return (
    <div>
      <div className="font-medium text-ink">{material.title}</div>
      <div className="text-[12px] text-muted">
        {material.material_type}
        {material.size ? ` · ${material.size}` : ''}
      </div>
    </div>
  )
}
