import { useState } from 'react'
import { Download } from 'lucide-react'
import { downloadFileById } from '@/shared/lib/httpClient'

export function FileLink({ id, filename }: { id: number; filename: string }) {
  const [downloading, setDownloading] = useState(false)

  async function handleClick() {
    setDownloading(true)
    try {
      await downloadFileById(id, filename)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={downloading}
      className="inline-flex items-center gap-1.5 text-[13px] text-brand-dark hover:underline disabled:opacity-50"
    >
      <Download size={13} />
      {downloading ? 'Скачиваем…' : filename}
    </button>
  )
}
