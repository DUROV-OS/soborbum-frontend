import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Field, Input } from '@/shared/ui/Field'
import { FileDrop } from '@/shared/ui/FileDrop'
import { useClientsStore } from '../store'
import { isGroupEditable, isGroupVisible } from '../rules'
import { Client } from '../types'
import { ReadRow, Section } from './ProjectPanel'

export function DocumentPanel({ client }: { client: Client }) {
  const updateDocument = useClientsStore((s) => s.updateDocument)
  const editable = isGroupEditable(client, 'document')
  const [draft, setDraft] = useState(client.document)
  const [saving, setSaving] = useState(false)

  if (!isGroupVisible(client, 'document')) return null

  async function save() {
    setSaving(true)
    await updateDocument(client.id, draft)
    setSaving(false)
  }

  if (!editable) {
    return (
      <Section title="Документы и договор">
        <ReadRow
          label="Итоговая цена"
          value={client.document.finalPrice ? `${client.document.finalPrice.toLocaleString('ru-RU')} ₽` : undefined}
        />
        <ReadRow label="Адрес установки" value={client.document.installAddress} />
        <ReadRow label="Проект дома" value={client.document.projectFile?.name} />
        <ReadRow label="Договор" value={client.document.contractFile?.name} />
      </Section>
    )
  }

  return (
    <Section title="Документы и договор">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Итоговая цена, ₽" required>
          <Input
            type="number"
            value={draft.finalPrice ?? ''}
            onChange={(e) => setDraft({ ...draft, finalPrice: Number(e.target.value) })}
          />
        </Field>
        <Field label="Адрес установки" required>
          <Input
            value={draft.installAddress ?? ''}
            onChange={(e) => setDraft({ ...draft, installAddress: e.target.value })}
          />
        </Field>
        <Field label="Проект дома" required>
          <FileDrop
            label="Прикрепить проект дома"
            attachment={draft.projectFile ?? null}
            onAttach={(file) => setDraft({ ...draft, projectFile: file })}
            onRemove={() => setDraft({ ...draft, projectFile: undefined })}
          />
        </Field>
        <Field label="Договор" required>
          <FileDrop
            label="Прикрепить договор"
            attachment={draft.contractFile ?? null}
            onAttach={(file) => setDraft({ ...draft, contractFile: file })}
            onRemove={() => setDraft({ ...draft, contractFile: undefined })}
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
