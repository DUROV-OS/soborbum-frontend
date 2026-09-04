import { MouseEvent, useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/auth/store'
import { Button } from '@/shared/ui/Button'
import { ChatPanel } from '../components/ChatPanel'
import { useAiStore } from '../store'
import { ChatDomain, DOMAIN_LABEL, DOMAIN_TO_SECTION } from '../types'

const ALL_DOMAINS: ChatDomain[] = ['general', 'clients', 'production', 'cycle', 'warehouse', 'marketing', 'tasks']

export function AiChatPage() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const hasAccess = useAuthStore((s) => s.hasAccess)
  const chats = useAiStore((s) => s.chats)
  const chatsLoading = useAiStore((s) => s.chatsLoading)
  const activeChat = useAiStore((s) => s.activeChat)
  const draftDomain = useAiStore((s) => s.draftDomain)
  const loadChats = useAiStore((s) => s.loadChats)
  const openChat = useAiStore((s) => s.openChat)
  const startDraft = useAiStore((s) => s.startDraft)
  const removeChat = useAiStore((s) => s.removeChat)

  // На мобильной ширине список чатов и переписка не помещаются рядом — показываем одно за раз.
  const showChatPanel = Boolean(chatId) || draftDomain !== null

  const domains = ALL_DOMAINS.filter((d) => d === 'general' || hasAccess(DOMAIN_TO_SECTION[d]))
  const [domain, setDomain] = useState<ChatDomain>('general')

  useEffect(() => {
    loadChats(domain)
  }, [domain, loadChats])

  useEffect(() => {
    // Пропускаем повторную загрузку, если чат только что создан первым сообщением —
    // он уже лежит в activeChat, а URL просто синхронизировался следом.
    if (chatId && useAiStore.getState().activeChat?.id !== Number(chatId)) {
      openChat(Number(chatId))
    }
  }, [chatId, openChat])

  useEffect(() => {
    if (activeChat) setDomain(activeChat.domain)
  }, [activeChat?.id, activeChat?.domain])

  function handleNewChat() {
    startDraft(domain)
    navigate('/ai')
  }

  async function handleDelete(id: number, e: MouseEvent) {
    e.stopPropagation()
    await removeChat(id)
    if (String(id) === chatId) navigate('/ai')
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div
        className={`w-full flex-col rounded-md border border-border bg-surface sm:flex sm:w-72 sm:shrink-0 ${
          showChatPanel ? 'hidden' : 'flex'
        }`}
      >
        <div className="flex flex-col gap-2 border-b border-border p-3">
          <div className="flex flex-wrap gap-1">
            {domains.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDomain(d)}
                className={`rounded-pill px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  d === domain ? 'bg-brand/10 text-brand-dark' : 'text-muted hover:bg-surface-muted hover:text-ink'
                }`}
              >
                {DOMAIN_LABEL[d]}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={handleNewChat}>
            <Plus size={14} />
            Новый чат
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {chatsLoading && <p className="px-2 py-2 text-[12px] text-muted">Загрузка…</p>}
          {!chatsLoading && chats.length === 0 && (
            <p className="px-2 py-2 text-[12px] text-muted">Чатов пока нет — начните новый.</p>
          )}
          <div className="flex flex-col gap-1">
            {chats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate(`/ai/${c.id}`)}
                className={`group flex items-start justify-between gap-2 rounded-sm px-3 py-2 text-left transition-colors ${
                  String(c.id) === chatId ? 'bg-brand/10' : 'hover:bg-surface-muted'
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-ink">{c.title ?? 'Без названия'}</div>
                  <div className="mt-0.5 text-[11px] text-muted">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ru })}
                  </div>
                </div>
                <span
                  role="button"
                  onClick={(e) => handleDelete(c.id, e)}
                  aria-label="Удалить чат"
                  className="shrink-0 rounded-pill p-1 text-muted opacity-0 hover:bg-danger-bg hover:text-danger group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`min-w-0 flex-1 rounded-md border border-border bg-surface sm:flex ${
          showChatPanel ? 'flex' : 'hidden'
        }`}
      >
        <ChatPanel
          onDeleted={() => navigate('/ai')}
          onChatCreated={(id) => navigate(`/ai/${id}`, { replace: true })}
          onBack={() => {
            navigate('/ai')
            useAiStore.setState({ draftDomain: null })
          }}
        />
      </div>
    </div>
  )
}
