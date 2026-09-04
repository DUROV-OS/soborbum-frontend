import { useEffect } from 'react'
import { Drawer } from '@/shared/ui/Drawer'
import { useAiStore } from '../store'
import { ChatDomain, DOMAIN_LABEL } from '../types'
import { ChatPanel } from './ChatPanel'

export function AskAiDrawer({
  open,
  onClose,
  domain,
  contextLabel,
  contextPrefix,
}: {
  open: boolean
  onClose: () => void
  domain: ChatDomain
  contextLabel?: string
  contextPrefix?: string
}) {
  const startDraft = useAiStore((s) => s.startDraft)

  useEffect(() => {
    if (open) startDraft(domain)
  }, [open, domain, startDraft])

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Спросить ИИ · ${DOMAIN_LABEL[domain]}`}
      bodyClassName="flex-1 overflow-hidden"
    >
      <ChatPanel contextLabel={contextLabel} contextPrefix={contextPrefix} onDeleted={onClose} />
    </Drawer>
  )
}
