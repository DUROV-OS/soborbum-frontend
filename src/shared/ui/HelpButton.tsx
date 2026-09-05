import { HelpCircle } from 'lucide-react'

export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Помощь по разделу"
      title="Как пользоваться этим разделом"
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border border-border text-muted transition-colors hover:border-brand/40 hover:text-brand-dark"
    >
      <HelpCircle size={16} />
    </button>
  )
}
