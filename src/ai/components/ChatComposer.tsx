import { KeyboardEvent, useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Textarea } from '@/shared/ui/Field'

export function ChatComposer({ sending, onSend }: { sending: boolean; onSend: (message: string) => void }) {
  const [value, setValue] = useState('')

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || sending) return
    onSend(trimmed)
    setValue('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-border px-4 py-3">
      <Textarea
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Спросите что-нибудь…"
        className="max-h-32 resize-none"
        disabled={sending}
      />
      <Button size="sm" onClick={submit} disabled={sending || !value.trim()}>
        <Send size={15} />
      </Button>
    </div>
  )
}
