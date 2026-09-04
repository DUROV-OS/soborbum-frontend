import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Field, Input, Textarea } from '@/shared/ui/Field'
import { useClientsStore } from '../store'
import { isGroupEditable, isGroupVisible } from '../rules'
import { Client } from '../types'

export function ProjectPanel({ client }: { client: Client }) {
  const updateProject = useClientsStore((s) => s.updateProject)
  const editable = isGroupEditable(client, 'project')
  const [draft, setDraft] = useState(client.project)
  const [saving, setSaving] = useState(false)

  if (!isGroupVisible(client, 'project')) return null

  async function save() {
    setSaving(true)
    await updateProject(client.id, draft)
    setSaving(false)
  }

  if (!editable) {
    return (
      <Section title="Проектная информация">
        <ReadRow label="Пожелания" value={client.project.wishes} />
        <ReadRow label="Тип дома" value={client.project.houseType} />
        <ReadRow label="Площадь" value={client.project.area ? `${client.project.area} м²` : undefined} />
        <ReadRow
          label="Ориентировочная цена"
          value={client.project.estimatedPrice ? `${client.project.estimatedPrice.toLocaleString('ru-RU')} ₽` : undefined}
        />
      </Section>
    )
  }

  return (
    <Section title="Проектная информация">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Пожелания по проекту" required>
            <Textarea
              rows={3}
              value={draft.wishes ?? ''}
              onChange={(e) => setDraft({ ...draft, wishes: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Тип дома / модуль" required>
          <Input
            value={draft.houseType ?? ''}
            onChange={(e) => setDraft({ ...draft, houseType: e.target.value })}
          />
        </Field>
        <Field label="Площадь, м²" required>
          <Input
            type="number"
            value={draft.area ?? ''}
            onChange={(e) => setDraft({ ...draft, area: Number(e.target.value) })}
          />
        </Field>
        <Field label="Ориентировочная цена, ₽" required>
          <Input
            type="number"
            value={draft.estimatedPrice ?? ''}
            onChange={(e) => setDraft({ ...draft, estimatedPrice: Number(e.target.value) })}
          />
        </Field>
      </div>
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

export function ReadRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border py-2 text-[13px] last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-ink">{value || '—'}</span>
    </div>
  )
}
