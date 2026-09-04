import { useEffect, useState } from 'react'
import { Chip } from '@/shared/ui/Chip'
import { Button } from '@/shared/ui/Button'
import { Drawer } from '@/shared/ui/Drawer'
import { Field, Input } from '@/shared/ui/Field'
import { DataTable } from '@/shared/ui/DataTable'
import * as warehouseApi from '../api'
import { useWarehouseStore } from '../store'
import { Material, MOVEMENT_REASON_LABEL, StockMovement } from '../types'

export function MaterialDetailDrawer({ material, onClose }: { material: Material | null; onClose: () => void }) {
  const updateMaterial = useWarehouseStore((s) => s.updateMaterial)
  const [threshold, setThreshold] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<StockMovement[]>([])

  useEffect(() => {
    if (material) {
      setThreshold(material.threshold)
      warehouseApi.materialHistory(material.id).then(setHistory)
    }
  }, [material])

  if (!material) return null

  const materialId = material.id

  async function save() {
    if (threshold === '') return
    setSaving(true)
    const result = await updateMaterial(materialId, { threshold })
    setSaving(false)
    setError(result.ok ? null : result.reason ?? 'Не удалось сохранить')
  }

  return (
    <Drawer
      open={!!material}
      onClose={onClose}
      title={material.title}
      subtitle={
        <div className="flex items-center gap-2">
          <span>{material.material_type}{material.size ? ` · ${material.size}` : ''}</span>
          {material.needs_supply && <Chip tone="danger">Требуется поставка</Chip>}
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4 text-[13px]">
          <Row label="На складе" value={`${material.quantity_in_stock} ${material.unit}`} />
          <Row label="Суммарно запрошено" value={`${material.total_requested} ${material.unit}`} />
          <Row label="Поставщик" value={material.supplier_name ?? '—'} />
          <Row label="Контакт поставщика" value={material.supplier_contact ?? material.supplier_phone ?? '—'} />
        </div>

        <div>
          <Field label="Пороговое значение">
            <div className="flex gap-2">
              <Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value === '' ? '' : Number(e.target.value))} />
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? '…' : 'Сохранить'}
              </Button>
            </div>
          </Field>
          {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
        </div>

        {material.request_breakdown.length > 0 && (
          <div>
            <div className="mb-2 text-[13px] font-medium text-ink">Запрошено по модулям</div>
            <div className="flex flex-col gap-1.5">
              {material.request_breakdown.map((item) => (
                <div key={item.module_id} className="flex justify-between text-[13px]">
                  <span className="text-muted">{item.module_name}</span>
                  <span className="tabular text-ink">{item.quantity_requested} {material.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 text-[13px] font-medium text-ink">История движения</div>
          <DataTable
            columns={[
              { header: 'Дата', accessor: (m) => new Date(m.created_at).toLocaleString('ru-RU') },
              { header: 'Причина', accessor: (m) => MOVEMENT_REASON_LABEL[m.reason] },
              {
                header: 'Изменение',
                align: 'right',
                accessor: (m) => (
                  <span className={m.delta >= 0 ? 'text-success' : 'text-danger'}>
                    {m.delta >= 0 ? '+' : ''}
                    {m.delta}
                  </span>
                ),
              },
            ]}
            rows={history}
            keyOf={(m) => String(m.id)}
            emptyLabel="Движений пока нет"
          />
        </div>
      </div>
    </Drawer>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted">{label}</div>
      <div className="tabular text-ink">{value}</div>
    </div>
  )
}
