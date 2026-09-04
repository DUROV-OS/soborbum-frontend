import { useEffect, useState } from 'react'
import { Plus, Truck } from 'lucide-react'
import { AskAiButton } from '@/ai/components/AskAiButton'
import { SectionAnalyticsCard } from '@/ai/components/SectionAnalyticsCard'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { DataTable } from '@/shared/ui/DataTable'
import { Input, Select } from '@/shared/ui/Field'
import { Tabs } from '@/shared/ui/Tabs'
import { useWarehouseStore } from '../store'
import { Material } from '../types'
import { CreateMaterialModal } from '../components/CreateMaterialModal'
import { SupplyIntakeModal } from '../components/SupplyIntakeModal'
import { MaterialDetailDrawer } from '../components/MaterialDetailDrawer'
import { RequestApprovalQueue } from '../components/RequestApprovalQueue'
import { MovementHistoryPanel } from '../components/MovementHistoryPanel'

type Tab = 'materials' | 'requests' | 'history'

type SortKey = 'name' | 'stock_desc' | 'stock_asc' | 'threshold_desc'

const SORT_LABEL: Record<SortKey, string> = {
  name: 'По названию',
  stock_desc: 'По остатку (убыв.)',
  stock_asc: 'По остатку (возр.)',
  threshold_desc: 'По порогу (убыв.)',
}

export function WarehousePage() {
  const materials = useWarehouseStore((s) => s.materials)
  const loading = useWarehouseStore((s) => s.loading)
  const load = useWarehouseStore((s) => s.load)
  const [tab, setTab] = useState<Tab>('materials')
  const [creatingMaterial, setCreatingMaterial] = useState(false)
  const [supplying, setSupplying] = useState(false)
  const [selected, setSelected] = useState<Material | null>(null)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [onlyNeedsSupply, setOnlyNeedsSupply] = useState(false)

  useEffect(() => {
    load()
  }, [load])

  const q = query.trim().toLowerCase()
  const visibleMaterials = materials
    .filter((m) => !onlyNeedsSupply || m.needs_supply)
    .filter(
      (m) =>
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.material_type.toLowerCase().includes(q) ||
        (m.size ?? '').toLowerCase().includes(q) ||
        (m.supplier_name ?? '').toLowerCase().includes(q),
    )
    .sort((a, b) => {
      if (sortKey === 'name') return a.title.localeCompare(b.title, 'ru')
      if (sortKey === 'stock_desc') return b.quantity_in_stock - a.quantity_in_stock
      if (sortKey === 'stock_asc') return a.quantity_in_stock - b.quantity_in_stock
      return b.threshold - a.threshold
    })

  return (
    <div>
      <SectionAnalyticsCard section="warehouse" />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-ink">Склад</h1>
          <p className="mt-1 text-[13px] text-muted">Материалы, заявки от производства и история движения</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AskAiButton domain="warehouse" />
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
        <>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по материалу, типу, поставщику…"
              className="sm:max-w-xs"
            />
            <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="w-full sm:w-56">
              {Object.entries(SORT_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
            <Button
              variant={onlyNeedsSupply ? 'primary' : 'secondary'}
              size="sm"
              className="shrink-0"
              onClick={() => setOnlyNeedsSupply((v) => !v)}
            >
              Нужна поставка
            </Button>
          </div>
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
            rows={visibleMaterials}
            keyOf={(m) => String(m.id)}
            onRowClick={setSelected}
            loading={loading}
          />
        </>
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
