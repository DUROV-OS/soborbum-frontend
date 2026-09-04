import { useRef, useState } from 'react'
import { Paperclip } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Field, Input } from '@/shared/ui/Field'
import { FileLink } from '@/shared/ui/FileLink'
import { useClientsStore } from '../store'
import { isGroupEditable, isGroupVisible } from '../rules'
import { Client, FileAsset } from '../types'
import { ReadRow, Section } from './ProjectPanel'

export function DocumentPanel({ client }: { client: Client }) {
  const updateDocuments = useClientsStore((s) => s.updateDocuments)
  const editable = isGroupEditable(client, 'documents')
  const [finalPrice, setFinalPrice] = useState(client.final_price ?? '')
  const [address, setAddress] = useState(client.installation_address ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isGroupVisible(client, 'documents')) return null

  async function save() {
    setSaving(true)
    const result = await updateDocuments(client.id, {
      final_price: finalPrice === '' ? undefined : Number(finalPrice),
      installation_address: address || undefined,
    })
    setSaving(false)
    setError(result.ok ? null : result.reason ?? 'Не удалось сохранить')
  }

  if (!editable) {
    return (
      <Section title="Документы и договор">
        <ReadRow
          label="Итоговая цена"
          value={client.final_price ? `${client.final_price.toLocaleString('ru-RU')} ₽` : undefined}
        />
        <ReadRow label="Адрес установки" value={client.installation_address ?? undefined} />
        <ReadRow
          label="Проект дома"
          value={client.house_project_file && <FileLink id={client.house_project_file.id} filename={client.house_project_file.filename} />}
        />
        <ReadRow
          label="Договор"
          value={client.contract_file && <FileLink id={client.contract_file.id} filename={client.contract_file.filename} />}
        />
      </Section>
    )
  }

  return (
    <Section title="Документы и договор">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Итоговая цена, ₽" required>
          <Input type="number" value={finalPrice} onChange={(e) => setFinalPrice(e.target.value === '' ? '' : Number(e.target.value))} />
        </Field>
        <Field label="Адрес установки" required>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
        <Field label="Проект дома" required>
          <FileUploadButton
            asset={client.house_project_file}
            onUpload={(file) => useClientsStore.getState().uploadHouseProjectFile(client.id, file)}
          />
        </Field>
        <Field label="Договор" required>
          <FileUploadButton
            asset={client.contract_file}
            onUpload={(file) => useClientsStore.getState().uploadContractFile(client.id, file)}
          />
        </Field>
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

function FileUploadButton({
  asset,
  onUpload,
}: {
  asset: FileAsset | null
  onUpload: (file: File) => Promise<{ ok: boolean; reason?: string }>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    const result = await onUpload(file)
    setUploading(false)
    setError(result.ok ? null : result.reason ?? 'Не удалось загрузить файл')
  }

  const input = <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />

  if (asset) {
    return (
      <div>
        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-muted px-3 py-2">
          <FileLink id={asset.id} filename={asset.filename} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="shrink-0 text-[12px] text-muted hover:text-brand disabled:opacity-50"
          >
            {uploading ? 'Загрузка…' : 'Заменить'}
          </button>
        </div>
        {input}
        {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
      </div>
    )
  }

  return (
    <div>
      {input}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-[13px] text-muted hover:border-brand/40 hover:text-brand disabled:opacity-50"
      >
        <Paperclip size={14} />
        {uploading ? 'Загрузка…' : 'Прикрепить файл'}
      </button>
      {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
    </div>
  )
}
