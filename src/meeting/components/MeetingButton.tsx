import { Mic } from 'lucide-react'
import { useAuthStore } from '@/auth/store'
import { useMeetingStore } from '../store'

/**
 * Кнопка «Совещание» в Topbar рядом с выбором аккаунта. Видна только при
 * доступе к разделу «Марина». Оранжевый ИИ-акцент — токены --ai / --ai-accent
 * (палитра задачи 0008).
 */
export function MeetingButton() {
  const hasAccess = useAuthStore((s) => s.hasAccess)
  const phase = useMeetingStore((s) => s.phase)
  const start = useMeetingStore((s) => s.start)
  const openPanel = useMeetingStore((s) => s.openPanel)

  if (!hasAccess('ai')) return null

  const busy = phase === 'starting' || phase === 'recording' || phase === 'finishing'

  return (
    <button
      type="button"
      onClick={() => (busy ? openPanel() : void start())}
      aria-label="Режим «Совещание»"
      aria-pressed={busy}
      className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-[13px] font-medium transition-colors ${
        busy
          ? 'border-ai/30 bg-ai-bg text-ai-accent'
          : 'border-ai/25 text-ai-accent hover:bg-ai-bg'
      }`}
    >
      <Mic size={14} />
      <span className="hidden sm:inline">Совещание</span>
      {busy && <span className="h-2 w-2 animate-pulse rounded-pill bg-red-500" />}
    </button>
  )
}
