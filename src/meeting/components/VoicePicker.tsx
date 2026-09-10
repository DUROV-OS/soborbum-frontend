import { useEffect, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { speakPrincess } from '@/shared/lib/speechReply'
import { applyVoiceId, listVoiceChoices, loadVoiceId } from '../voice'

export function VoicePicker() {
  const [id, setId] = useState(loadVoiceId)
  const [choices, setChoices] = useState(listVoiceChoices)

  useEffect(() => {
    applyVoiceId(loadVoiceId())
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const refresh = () => setChoices(listVoiceChoices())
    window.speechSynthesis.addEventListener('voiceschanged', refresh)
    refresh()
    return () => window.speechSynthesis.removeEventListener('voiceschanged', refresh)
  }, [])

  function change(next: string) {
    setId(next)
    applyVoiceId(next)
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="meeting-voice" className="text-[12px] text-muted">
        Голос Марины
      </label>
      <select
        id="meeting-voice"
        value={id}
        onChange={(e) => change(e.target.value)}
        className="min-w-0 flex-1 rounded-sm border border-border bg-surface px-1.5 py-1 text-[12px] text-ink"
      >
        {choices.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => void speakPrincess('Проверка голоса Марины')}
        aria-label="Проба голоса"
        className="shrink-0 text-muted hover:text-ink"
      >
        <Volume2 size={14} />
      </button>
    </div>
  )
}
