import { ChangeEvent, KeyboardEvent, useRef, useState } from 'react'
import { Paperclip, Send } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Textarea } from '@/shared/ui/Field'
import { FileAssetOut } from '../types'
import { AttachmentChip } from './AttachmentChip'

// Держим в синхронизации с app/ai/attachments.py: ALLOWED_MEDIA_TYPES на бэкенде.
const ACCEPTED_TYPES =
  'image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,text/csv,text/markdown,application/json'

export function ChatComposer({
  sending,
  attachments,
  uploadingAttachment,
  onSend,
  onAttach,
  onRemoveAttachment,
}: {
  sending: boolean
  attachments: FileAssetOut[]
  uploadingAttachment: boolean
  onSend: (message: string) => void
  onAttach: (file: File) => void
  onRemoveAttachment: (id: number) => void
}) {
  const [value, setValue] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function submit() {
    const trimmed = value.trim()
    if (sending || (!trimmed && attachments.length === 0)) return
    onSend(trimmed)
    setValue('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function handleFilesSelected(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    files.forEach(onAttach)
  }

  const canSend = !sending && (value.trim().length > 0 || attachments.length > 0)

  return (
    <div className="border-t border-border px-4 py-3">
      {(attachments.length > 0 || uploadingAttachment) && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {attachments.map((asset) => (
            <AttachmentChip
              key={asset.id}
              filename={asset.filename}
              contentType={asset.content_type}
              onRemove={() => onRemoveAttachment(asset.id)}
            />
          ))}
          {uploadingAttachment && <span className="text-[12px] text-muted">Загрузка файла…</span>}
        </div>
      )}
      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={handleFilesSelected}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          aria-label="Прикрепить файл"
          className="mb-1 shrink-0 rounded-pill p-2 text-muted hover:bg-surface-muted hover:text-brand disabled:opacity-50"
        >
          <Paperclip size={16} />
        </button>
        <Textarea
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Спросите что-нибудь…"
          className="max-h-32 resize-none"
          disabled={sending}
        />
        <Button size="sm" onClick={submit} disabled={!canSend}>
          <Send size={15} />
        </Button>
      </div>
    </div>
  )
}
