import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Field, Input, Textarea } from '@/shared/ui/Field'
import { useClientsStore } from '../store'
import { isGroupEditable, isGroupVisible } from '../rules'
import { Client } from '../types'

export function ProjectPanel({ client }: { client: Client }) {
  const updateProject = useClientsStore((s) => s.updateProject)
  const editable = isGroupEditable(client, 'project')
  const [wishes, setWishes] = useState(client.wishes_description ?? '')
  const [area, setArea] = useState(client.house_area ?? '')
  const [price, setPrice] = useState(client.estimated_price ?? '')
  const [layout, setLayout] = useState(client.layout_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isGroupVisible(client, 'project')) return null

  async function save() {
    setSaving(true)
    const result = await updateProject(client.id, {
      wishes_description: wishes || undefined,
      house_area: area === '' ? undefined : Number(area),
      estimated_price: price === '' ? undefined : Number(price),
      layout_notes: layout || undefined,
    })
    setSaving(false)
    setError(result.ok ? null : result.reason ?? 'Не удалось сохранить')
  }

  if (!editable) {
    return (
      <Section title="Проектная информация">
        <ReadRow label="Пожелания" value={client.wishes_description ?? undefined} />
        <ReadRow label="Площадь" value={client.house_area ? `${client.house_area} м²` : undefined} />
        <ReadRow
          label="Ориентировочная цена"
          value={client.estimated_price ? `${client.estimated_price.toLocaleString('ru-RU')} ₽` : undefined}
        />
        <ReadRow label="Заметки по планировке" value={client.layout_notes ?? undefined} />
      </Section>
    )
  }

  return (
    <Section title="Проектная информация">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Пожелания по проекту" required>
            <Textarea rows={3} value={wishes} onChange={(e) => setWishes(e.target.value)} />
          </Field>
        </div>
        <Field label="Площадь, м²" required>
          <Input type="number" value={area} onChange={(e) => setArea(e.target.value === '' ? '' : Number(e.target.value))} />
        </Field>
        <Field label="Ориентировочная цена, ₽" required>
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} />
        </Field>
        <div className="col-span-2">
          <Field label="Заметки по планировке" required>
            <Textarea rows={2} value={layout} onChange={(e) => setLayout(e.target.value)} />
          </Field>
        </div>
      </div>
      {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}
      <div className="mt-4">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </Button>
      </div>
    </Section>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface p-5">
      <h3 className="mb-4 text-[14px] font-medium text-ink">{title}</h3>
      {children}
    </div>
  )
}

export function ReadRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border py-2 text-[13px] last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-ink">{value || '—'}</span>
    </div>
  )
}
