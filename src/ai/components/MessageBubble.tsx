import { Wrench } from 'lucide-react'
import { Markdown } from '@/shared/ui/Markdown'
import { MessageOut, PendingActionOut } from '../types'
import { PendingActionCard } from './PendingActionCard'

export function MessageBubble({
  message,
  pendingActions,
  onResolve,
}: {
  message: MessageOut
  pendingActions: PendingActionOut[]
  onResolve: (id: number, decision: 'approve' | 'reject') => Promise<unknown>
}) {
  if (message.role !== 'user' && message.role !== 'assistant') return null

  const isUser = message.role === 'user'
  const textBlocks = message.content.filter((block) => block.type === 'text' || (!block.type && typeof block.text === 'string'))
  const toolBlocks = message.content.filter((block) => block.type === 'tool_use')
  const text = textBlocks.map((block) => block.text).filter(Boolean).join('\n\n')
  const relatedActions = pendingActions.filter((action) => action.message_id === message.id)

  if (!text && toolBlocks.length === 0 && relatedActions.length === 0) return null

  return (
    <div className={`flex min-w-0 flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
      {text && (
        <Markdown
          text={text}
          className={`max-w-[85%] break-words rounded-md px-3.5 py-2.5 text-[13px] leading-relaxed sm:max-w-md ${
            isUser ? 'bg-brand text-white' : 'bg-surface-muted text-ink'
          }`}
        />
      )}
      {!isUser &&
        toolBlocks.map(
          (block, i) =>
            !relatedActions.some((a) => a.tool_name === block.name) && (
              <div
                key={block.id ?? i}
                className="flex items-center gap-1.5 rounded-pill bg-surface-muted px-3 py-1 text-[12px] text-muted"
              >
                <Wrench size={12} />
                {block.name}
              </div>
            ),
        )}
      {relatedActions.map((action) => (
        <PendingActionCard key={action.id} action={action} onResolve={onResolve} />
      ))}
    </div>
  )
}
