import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useAuthStore } from '@/auth/store'
import { Button } from '@/shared/ui/Button'
import { ChatDomain } from '../types'
import { AskAiDrawer } from './AskAiDrawer'

export function AskAiButton({
  domain,
  contextLabel,
  contextPrefix,
}: {
  domain: ChatDomain
  contextLabel?: string
  contextPrefix?: string
}) {
  const hasAccess = useAuthStore((s) => s.hasAccess)
  const [open, setOpen] = useState(false)

  if (!hasAccess('ai')) return null

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Sparkles size={14} />
        Спросить ИИ
      </Button>
      <AskAiDrawer
        open={open}
        onClose={() => setOpen(false)}
        domain={domain}
        contextLabel={contextLabel}
        contextPrefix={contextPrefix}
      />
    </>
  )
}
