import { FileText, Image as ImageIcon, X } from 'lucide-react'
import { Chip } from '@/shared/ui/Chip'

export function AttachmentChip({
  filename,
  contentType,
  onClick,
  onRemove,
}: {
  filename: string
  contentType?: string
  /** Открыть/скачать уже отправленное вложение. */
  onClick?: () => void
  /** Убрать ещё не отправленное вложение из черновика сообщения. */
  onRemove?: () => void
}) {
  const isImage = contentType?.startsWith('image/')

  return (
    <Chip tone="neutral">
      <span className="flex max-w-[160px] items-center gap-1">
        {isImage ? <ImageIcon size={12} className="shrink-0" /> : <FileText size={12} className="shrink-0" />}
        {onClick ? (
          <button type="button" onClick={onClick} className="truncate hover:underline" title={filename}>
            {filename}
          </button>
        ) : (
          <span className="truncate" title={filename}>
            {filename}
          </span>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Убрать файл ${filename}`}
            className="shrink-0 text-muted hover:text-danger"
          >
            <X size={11} />
          </button>
        )}
      </span>
    </Chip>
  )
}
