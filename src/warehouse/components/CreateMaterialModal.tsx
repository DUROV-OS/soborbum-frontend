import { useEffect, useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Field, Input, Select } from '@/shared/ui/Field'
import { Modal } from '@/shared/ui/Modal'
import * as warehouseApi from '../api'
import { useWarehouseStore } from '../store'

export function CreateMaterialModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createMaterial = useWarehouseStore((s) => s.createMaterial)
  const [warehouses, setWarehouses] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [warehouse, setWarehouse] = useState('')
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [unit, setUnit] = useState('')
  const [inStock, setInStock] = useState<number | ''>('')
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('')
  const [threshold, setThreshold] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    warehouseApi.listWarehouses().then((rows) => {
      setWarehouses(rows)
      setWarehouse((prev) => prev || rows[0] || '')
    })
    warehouseApi.listCategories().then(setCategories)
  }, [open])

  const valid = warehouse && title && code && unit

  function reset() {
    setCategory('')
    setTitle('')
    setCode('')
    setUnit('')
    setInStock('')
    setPurchasePrice('')
    setThreshold('')
    setError(null)
  }

  async function handleSubmit() {
    if (!valid) return
    setSaving(true)
    const result = await createMaterial({
      warehouse,
      category: category || undefined,
      title,
      code,
      unit,
      quantity_in_stock: inStock === '' ? undefined : inStock,
      purchase_price: purchasePrice === '' ? undefined : purchasePrice,
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
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Доска обрезная 150×50×6000" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Склад" required>
            <Select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
              {warehouses.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Категория">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">— не выбрана —</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Код" required>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="BRUS-150-50" />
          </Field>
          <Field label="Единица измерения" required>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="шт" />
          </Field>
          <Field label="Начальный остаток">
            <Input type="number" value={inStock} onChange={(e) => setInStock(e.target.value === '' ? '' : Number(e.target.value))} />
          </Field>
          <Field label="Закупочная цена, ₽">
            <Input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))} />
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
