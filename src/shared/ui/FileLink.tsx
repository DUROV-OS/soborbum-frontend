import { useState } from 'react'
import { Paperclip } from 'lucide-react'
import { openFile } from '@/shared/lib/httpClient'

export function FileLink({ id, filename }: { id: number; filename: string }) {
  const [opening, setOpening] = useState(false)

  async function handleClick() {
    setOpening(true)
    try {
      await openFile(id, filename)
    } finally {
      setOpening(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={opening}
      className="inline-flex items-center gap-1.5 text-[13px] text-brand-dark hover:underline disabled:opacity-50"
    >
      <Paperclip size={13} />
      {opening ? 'Открываем…' : filename}
    </button>
  )
}
