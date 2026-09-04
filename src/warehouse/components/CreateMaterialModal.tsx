import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Field, Input } from '@/shared/ui/Field'
import { Modal } from '@/shared/ui/Modal'
import { useWarehouseStore } from '../store'

export function CreateMaterialModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createMaterial = useWarehouseStore((s) => s.createMaterial)
  const [materialType, setMaterialType] = useState('')
  const [size, setSize] = useState('')
  const [title, setTitle] = useState('')
  const [unit, setUnit] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [inStock, setInStock] = useState<number | ''>('')
  const [threshold, setThreshold] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valid = materialType && title && unit

  function reset() {
    setMaterialType('')
    setSize('')
    setTitle('')
    setUnit('')
    setSupplierName('')
    setInStock('')
    setThreshold('')
    setError(null)
  }

  async function handleSubmit() {
    if (!valid) return
    setSaving(true)
    const result = await createMaterial({
      material_type: materialType,
      size: size || undefined,
      title,
      unit,
      supplier_name: supplierName || undefined,
      quantity_in_stock: inStock === '' ? undefined : inStock,
      threshold: threshold === '' ? undefined : threshold,
    })
    setSaving(false)
    if (result.ok) {
      reset()
      onClose()
    } else {
      setError(result.reason ?? 'Не удалось создать материал')
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Новый материал"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!valid || saving}>
            {saving ? 'Сохранение…' : 'Создать'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Название" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Доска обрезная" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Тип" required>
            <Input value={materialType} onChange={(e) => setMaterialType(e.target.value)} placeholder="Доска" />
          </Field>
          <Field label="Размер">
            <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="150×50×6000" />
          </Field>
          <Field label="Единица измерения" required>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="шт" />
          </Field>
          <Field label="Поставщик">
            <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
          </Field>
          <Field label="Начальный остаток">
            <Input type="number" value={inStock} onChange={(e) => setInStock(e.target.value === '' ? '' : Number(e.target.value))} />
          </Field>
          <Field label="Пороговое значение">
            <Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value === '' ? '' : Number(e.target.value))} />
          </Field>
        </div>
        {error && <p className="text-[12px] text-danger">{error}</p>}
      </div>
    </Modal>
  )
}
