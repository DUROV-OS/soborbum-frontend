import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Textarea } from '@/shared/ui/Field'
import { useClientsStore } from '../store'
import { Client } from '../types'
import { Section } from './ProjectPanel'

export function NotesPanel({ client }: { client: Client }) {
  const updateNotes = useClientsStore((s) => s.updateNotes)
  const [draft, setDraft] = useState(client.notes)
  const [saving, setSaving] = useState(false)
  const dirty = draft !== client.notes

  async function save() {
    setSaving(true)
    await updateNotes(client.id, draft)
    setSaving(false)
  }

  return (
    <Section title="Заметки">
      <Textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Личные заметки по клиенту…" />
      {dirty && (
        <div className="mt-3">
          <Button size="sm" variant="secondary" onClick={save} disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить заметку'}
          </Button>
        </div>
      )}
    </Section>
  )
}
