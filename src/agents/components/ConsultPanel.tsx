import { useEffect, useRef, useState } from 'react'
import { ChatComposer } from '@/ai/components/ChatComposer'
import { MessageBubble } from '@/ai/components/MessageBubble'
import { PendingActionModal } from '@/ai/components/PendingActionModal'
import { PendingActionOut } from '@/ai/types'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { useConsultStore } from '../consultStore'

export function ConsultPanel({ initialMessage = '' }: { initialMessage?: string }) {
  const hydrate = useConsultStore((state) => state.hydrate)
  const setDraft = useConsultStore((state) => state.setDraft)
  const messages = useConsultStore((state) => state.messages)
  const pendingActions = useConsultStore((state) => state.pendingActions)
  const sending = useConsultStore((state) => state.sending)
  const error = useConsultStore((state) => state.error)
  const draft = useConsultStore((state) => state.draft)
  const send = useConsultStore((state) => state.send)
  const resolveAction = useConsultStore((state) => state.resolveAction)
  const clear = useConsultStore((state) => state.clear)
  const [modalActions, setModalActions] = useState<PendingActionOut[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (initialMessage) setDraft(initialMessage)
  }, [initialMessage, setDraft])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, sending])

  const inlinePending = pendingActions.filter((action) => !modalActions.some((item) => item.id === action.id))

  async function handleSend(message: string) {
    await send(message)
    const next = useConsultStore.getState().pendingActions
    if (next.length > 0) setModalActions(next)
  }

  async function handleResolve(id: number, decision: 'approve' | 'reject') {
    await resolveAction(id, decision)
    setModalActions((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="flex h-[calc(100vh-16rem)] min-h-[28rem] min-w-0 flex-col rounded-2xl border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
        <div className="min-w-0">
          <Chip tone="brand">Консультация</Chip>
          <p className="mt-2 text-[13px] text-ink">
            Один чат. Те же сделки и склад, что у смены — спрашивай как у консультанта.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void clear()} disabled={sending}>
          Очистить чат
        </Button>
      </div>

      <div className="min-w-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="flex min-w-0 flex-col gap-3">
          {messages.length === 0 && !sending && (
            <p className="text-[13px] text-muted">Спросите про сделки, склад, цех или правило. Это не смена и не список чатов.</p>
          )}
          {messages.map((message) => (
            <MessageBubble
              key={`${message.role}-${message.id}`}
              message={message}
              pendingActions={inlinePending}
              onResolve={handleResolve}
            />
          ))}
          {sending && (
            <div className="flex items-center gap-1.5 rounded-md bg-surface-muted px-3.5 py-2.5 text-[13px] text-muted">
              Думаю — страницу обновлять не нужно
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {error && <p className="px-5 pb-2 text-[12px] text-danger">{error}</p>}

      <ChatComposer
        initialMessage={draft}
        sending={sending}
        attachments={[]}
        uploadingAttachment={false}
        allowAttach={false}
        onSend={handleSend}
        onAttach={() => {}}
        onRemoveAttachment={() => {}}
      />

      <PendingActionModal actions={modalActions} onClose={() => setModalActions([])} onResolve={handleResolve} />
    </div>
  )
}
