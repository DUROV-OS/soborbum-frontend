import { useRef } from 'react'
import { Paperclip, X } from 'lucide-react'

export interface Attachment {
  name: string
  sizeKb: number
}

export function FileDrop({
  label,
  attachment,
  onAttach,
  onRemove,
  disabled,
}: {
  label: string
  attachment: Attachment | null
  onAttach: (file: Attachment) => void
  onRemove: () => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  if (attachment) {
    return (
      <div className="flex items-center justify-between rounded-md border border-border bg-surface-muted px-3 py-2">
        <span className="flex items-center gap-2 text-[13px] text-ink">
          <Paperclip size={14} className="text-muted" />
          {attachment.name}
          <span className="tabular text-muted">{attachment.sizeKb} КБ</span>
        </span>
        {!disabled && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Убрать файл"
            className="rounded-pill p-1 text-muted hover:bg-surface hover:text-danger"
          >
            <X size={14} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onAttach({ name: file.name, sizeKb: Math.max(1, Math.round(file.size / 1024)) })
          e.target.value = ''
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-3 text-[13px] text-muted hover:border-brand/40 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Paperclip size={14} />
        {label}
      </button>
    </div>
  )
}
