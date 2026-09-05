import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Sparkles, Trash2 } from 'lucide-react'
import { Chip } from '@/shared/ui/Chip'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useAiStore } from '../store'
import { DOMAIN_LABEL, PendingActionOut } from '../types'
import { ChatComposer } from './ChatComposer'
import { ChatModeSelector } from './ChatModeSelector'
import { ChatTitleEditor } from './ChatTitleEditor'
import { MessageBubble } from './MessageBubble'
import { PendingActionModal } from './PendingActionModal'

export function ChatPanel({
  contextLabel,
  contextPrefix,
  onDeleted,
  onChatCreated,
  onBack,
}: {
  contextLabel?: string
  contextPrefix?: string
  onDeleted?: () => void
  /** Зовётся, когда первое сообщение только что создало чат — нужно, чтобы страница отразила id в URL. */
  onChatCreated?: (chatId: number) => void
  /** Кнопка "назад к списку", видна только на мобильной ширине — список и переписка не помещаются рядом. */
  onBack?: () => void
}) {
  const chat = useAiStore((s) => s.activeChat)
  const draftDomain = useAiStore((s) => s.draftDomain)
  const draftMode = useAiStore((s) => s.draftMode)
  const pendingActions = useAiStore((s) => s.pendingActions)
  const sending = useAiStore((s) => s.sending)
  const optimisticMessage = useAiStore((s) => s.optimisticMessage)
  const attachments = useAiStore((s) => s.attachments)
  const uploadingAttachment = useAiStore((s) => s.uploadingAttachment)
  const addAttachment = useAiStore((s) => s.addAttachment)
  const removeAttachment = useAiStore((s) => s.removeAttachment)
  const loadingChat = useAiStore((s) => s.loadingChat)
  const error = useAiStore((s) => s.error)
  const send = useAiStore((s) => s.send)
  const setMode = useAiStore((s) => s.setMode)
  const renameChat = useAiStore((s) => s.renameChat)
  const resolveAction = useAiStore((s) => s.resolveAction)
  const removeChat = useAiStore((s) => s.removeChat)

  const [modalActions, setModalActions] = useState<PendingActionOut[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  const domain = chat?.domain ?? draftDomain
  const mode = chat?.mode ?? draftMode
  // Актуальный попап уже показывает эти действия — не дублируем их карточками в самой переписке.
  const inlinePendingActions = pendingActions.filter((a) => !modalActions.some((m) => m.id === a.id))

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [chat?.messages.length, sending])

  if (!domain) {
    return <EmptyState icon={<Sparkles size={28} />} title="Выберите чат или начните новый" />
  }

  async function handleSend(message: string) {
    const isFirstMessage = !chat
    const finalMessage = isFirstMessage && contextPrefix ? contextPrefix + message : message
    const response = await send(finalMessage)
    if (response && isFirstMessage) onChatCreated?.(response.chat_id)
    if (response && response.status === 'pending_approval' && response.pending_actions.length > 0) {
      setModalActions(response.pending_actions)
    }
  }

  async function handleResolve(id: number, decision: 'approve' | 'reject') {
    const response = await resolveAction(id, decision)
    setModalActions((prev) => prev.filter((a) => a.id !== id))
    if (response && response.status === 'pending_approval' && response.pending_actions.length > 0) {
      setModalActions(response.pending_actions)
    }
  }

  async function handleDelete() {
    if (!chat) return
    await removeChat(chat.id)
    onDeleted?.()
  }

  return (
    <div className="flex h-full min-w-0 min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="К списку чатов"
              className="-ml-1 rounded-pill p-1 text-muted hover:bg-surface-muted hover:text-ink sm:hidden"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <Chip tone="brand">{DOMAIN_LABEL[domain]}</Chip>
          {contextLabel && <Chip tone="neutral">{contextLabel}</Chip>}
          {chat && <ChatTitleEditor title={chat.title} onRename={(title) => renameChat(chat.id, title)} />}
        </div>
        <div className="flex items-center gap-2">
          <ChatModeSelector mode={mode} onChange={setMode} />
          {chat && (
            <button
              type="button"
              onClick={handleDelete}
              aria-label="Удалить чат"
              className="rounded-pill p-1.5 text-muted hover:bg-danger-bg hover:text-danger"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1 overflow-y-auto px-4 py-4">
        {loadingChat ? (
          <p className="text-[13px] text-muted">Загрузка…</p>
        ) : (
          <div className="flex min-w-0 flex-col gap-3">
            {chat?.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                pendingActions={inlinePendingActions}
                onResolve={handleResolve}
              />
            ))}
            {(!chat || chat.messages.length === 0) && !sending && (
              <p className="text-[13px] text-muted">Начните диалог — задайте вопрос или попросите что-то сделать.</p>
            )}
            {optimisticMessage && (
              <div className="flex min-w-0 flex-col items-end">
                <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-md bg-brand px-3.5 py-2.5 text-[13px] leading-relaxed text-white opacity-70 sm:max-w-md">
                  {optimisticMessage}
                </div>
              </div>
            )}
            {sending && (
              <div className="flex items-center gap-1.5 rounded-md bg-surface-muted px-3.5 py-2.5 text-[13px] text-muted">
                <span className="flex gap-0.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
                </span>
                ИИ думает — это может занять до минуты, обновлять страницу не нужно
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && <p className="px-4 pb-2 text-[12px] text-danger">{error}</p>}

      <ChatComposer
        sending={sending}
        attachments={attachments}
        uploadingAttachment={uploadingAttachment}
        onSend={handleSend}
        onAttach={addAttachment}
        onRemoveAttachment={removeAttachment}
      />

      <PendingActionModal actions={modalActions} onClose={() => setModalActions([])} onResolve={handleResolve} />
    </div>
  )
}
