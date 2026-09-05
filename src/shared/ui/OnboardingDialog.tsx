import { ReactNode, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

export interface OnboardingPage {
  title: string
  body: ReactNode
}

export function OnboardingDialog({
  open,
  onClose,
  title,
  pages,
}: {
  open: boolean
  onClose: () => void
  title: string
  pages: OnboardingPage[]
}) {
  const [index, setIndex] = useState(0)

  if (!open) return null

  const page = pages[index]
  const isFirst = index === 0
  const isLast = index === pages.length - 1

  function handleClose() {
    setIndex(0)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div role="dialog" aria-modal aria-label={title} className="flex w-full max-w-lg flex-col rounded-md bg-surface shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-brand-dark">{title}</p>
            <h2 className="mt-0.5 truncate text-[16px] font-medium text-ink">{page.title}</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Закрыть"
            className="shrink-0 rounded-pill p-1 text-muted hover:bg-surface-muted hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 text-[13px] leading-relaxed text-ink">{page.body}</div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          <div className="flex gap-1.5" aria-hidden>
            {pages.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-pill ${i === index ? 'bg-brand' : 'bg-border'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {!isFirst && (
              <Button variant="ghost" size="sm" onClick={() => setIndex((i) => i - 1)}>
                Назад
              </Button>
            )}
            {!isLast && (
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Пропустить
              </Button>
            )}
            <Button size="sm" onClick={isLast ? handleClose : () => setIndex((i) => i + 1)}>
              {isLast ? 'Понятно' : 'Далее'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
