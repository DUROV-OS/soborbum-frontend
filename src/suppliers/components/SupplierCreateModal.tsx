import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Field, Input, Select } from '@/shared/ui/Field'
import { Modal } from '@/shared/ui/Modal'
import { useSuppliersStore } from '../store'
import { SUPPLIER_STATUS_LABEL, SupplierStatus } from '../types'

export function SupplierCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useSuppliersStore((s) => s.create)
  const [name, setName] = useState('')
  const [status, setStatus] = useState<SupplierStatus>('active')
  const [categories, setCategories] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valid = name.trim().length > 0

  function reset() {
    setName('')
    setStatus('active')
    setCategories('')
    setError(null)
  }

  async function handleSubmit() {
    if (!valid) return
    setSaving(true)
    const result = await create({
      name: name.trim(),
      status,
      categories: categories
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
    })
    setSaving(false)
    if (result.ok) {
      reset()
      onClose()
    } else {
      setError(result.reason ?? 'Не удалось создать поставщика')
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Новый поставщик"
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
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ООО «Брус-Трейд»" />
        </Field>
        <Field label="Статус">
          <Select value={status} onChange={(e) => setStatus(e.target.value as SupplierStatus)}>
            {Object.entries(SUPPLIER_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Категории" hint="Через запятую: брусы/доска, метизы">
          <Input
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            placeholder="брусы/доска, метизы"
          />
        </Field>
        {error && <p className="text-[12px] text-danger">{error}</p>}
      </div>
    </Modal>
  )
}
