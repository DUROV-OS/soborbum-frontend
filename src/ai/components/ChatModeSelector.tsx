import { ChatMode, MODE_LABEL } from '../types'

const MODES: ChatMode[] = ['no_actions', 'require_approval', 'auto_approve']

export function ChatModeSelector({ mode, onChange }: { mode: ChatMode; onChange: (mode: ChatMode) => void }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-pill border border-border bg-surface p-0.5">
      {MODES.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`rounded-pill px-2.5 py-1 text-[12px] font-medium transition-colors ${
            m === mode ? 'bg-brand text-white' : 'text-muted hover:text-ink'
          }`}
        >
          {MODE_LABEL[m]}
        </button>
      ))}
    </div>
  )
}
