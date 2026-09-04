import { useRef, useState } from 'react'
import { Download, Plus, Trash2, Upload } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Field, Input, Select } from '@/shared/ui/Field'
import { Modal } from '@/shared/ui/Modal'
import { Tabs } from '@/shared/ui/Tabs'
import * as warehouseApi from '../api'
import { useWarehouseStore } from '../store'

export function SupplyIntakeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const materials = useWarehouseStore((s) => s.materials)
  const createSupply = useWarehouseStore((s) => s.createSupply)
  const importSupply = useWarehouseStore((s) => s.importSupply)
  const [mode, setMode] = useState<'manual' | 'excel'>('manual')

  const [supplierName, setSupplierName] = useState('')
  const [lines, setLines] = useState<{ materialId: number; qty: number }[]>([
    { materialId: materials[0]?.id ?? 0, qty: 0 },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setSupplierName('')
    setLines([{ materialId: materials[0]?.id ?? 0, qty: 0 }])
    setError(null)
  }

  async function submitManual() {
    const validLines = lines.filter((l) => l.materialId && l.qty > 0)
    if (validLines.length === 0) return
    setSaving(true)
    const result = await createSupply(
      supplierName || undefined,
      validLines.map((l) => ({ warehouse_material_id: l.materialId, quantity: l.qty })),
    )
    setSaving(false)
    if (result.ok) {
      reset()
      onClose()
    } else {
      setError(result.reason ?? 'Не удалось оформить поставку')
    }
  }

  async function handleExcelFile(file: File) {
    setSaving(true)
    const result = await importSupply(file)
    setSaving(false)
    if (result.ok) {
      onClose()
    } else {
      setError(result.reason ?? 'Не удалось загрузить файл')
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Оформить поставку"
      width="max-w-2xl"
      footer={
        mode === 'manual' ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={submitManual} disabled={saving}>
              {saving ? 'Сохранение…' : 'Оформить'}
            </Button>
          </>
        ) : undefined
      }
    >
      <Tabs
        tabs={[
          { key: 'manual', label: 'Вручную' },
          { key: 'excel', label: 'Excel-файл' },
        ]}
        activeKey={mode}
        onChange={setMode}
      />

      <div className="mt-4">
        {mode === 'manual' ? (
          <div className="flex flex-col gap-4">
            <Field label="Поставщик">
              <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
            </Field>
            <div className="flex flex-col gap-2">
              {lines.map((line, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Select
                      value={line.materialId}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((l, i) => (i === index ? { ...l, materialId: Number(e.target.value) } : l)),
                        )
                      }
                    >
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      placeholder="Количество"
                      value={line.qty || ''}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((l, i) => (i === index ? { ...l, qty: Number(e.target.value) } : l)),
                        )
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                    className="rounded-pill p-2 text-muted hover:bg-surface-muted hover:text-danger"
                    aria-label="Убрать строку"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, { materialId: materials[0]?.id ?? 0, qty: 0 }])}
              className="flex items-center gap-1.5 self-start text-[13px] text-brand-dark hover:underline"
            >
              <Plus size={14} />
              Добавить строку
            </button>
            {error && <p className="text-[12px] text-danger">{error}</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => warehouseApi.downloadSupplyTemplate()}
              className="flex items-center gap-2 self-start text-[13px] text-brand-dark hover:underline"
            >
              <Download size={14} />
              Скачать шаблон таблицы
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) handleExcelFile(file)
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-6 text-[13px] text-muted hover:border-brand/40 hover:text-brand disabled:opacity-50"
            >
              <Upload size={16} />
              {saving ? 'Загрузка…' : 'Загрузить заполненный файл'}
            </button>
            {error && <p className="text-[12px] text-danger">{error}</p>}
          </div>
        )}
      </div>
    </Modal>
  )
}
