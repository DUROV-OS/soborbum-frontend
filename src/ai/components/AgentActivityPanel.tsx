import { useEffect, useState } from 'react'
import { Bot, ChevronRight, Sparkles } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { useAiStore } from '../store'
import { AgentActivityOut } from '../types'
import { AgentActivityDrawer } from './AgentActivityDrawer'

/** Третья колонка «Марины» — только для чтения лог того, что агент сделал сам
 * (см. предложение в задаче 0007). Не привязан к открытому чату — общий поток.
 * Сейчас наполняется только демо-данными на localhost (задача 0033). */
export function AgentActivityPanel() {
  const agentActivity = useAiStore((s) => s.agentActivity)
  const loading = useAiStore((s) => s.agentActivityLoading)
  const loadAgentActivity = useAiStore((s) => s.loadAgentActivity)
  const [selected, setSelected] = useState<AgentActivityOut | null>(null)

  useEffect(() => {
    loadAgentActivity()
  }, [loadAgentActivity])

  return (
    <div className="hidden min-w-0 flex-col rounded-md border border-border bg-surface xl:flex xl:w-80 xl:shrink-0">
      <div className="flex items-center gap-2 border-b border-border p-3">
        <Sparkles size={16} className="text-ai-accent" />
        <span className="text-[13px] font-medium text-ink">Действия агента</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading && <LoadingState label="Загрузка…" />}
        {!loading && agentActivity.length === 0 && (
          <EmptyState
            icon={<Bot size={22} />}
            title="Пока пусто"
            description="Здесь появится лог того, что агент сделал сам."
          />
        )}
        <div className="flex flex-col gap-1">
          {agentActivity.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="group flex items-start justify-between gap-2 rounded-sm px-3 py-2 text-left transition-colors hover:bg-surface-muted"
            >
              <div className="min-w-0">
                <div className="line-clamp-2 text-[13px] font-medium text-ink">{item.title}</div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                  <span
                    className={`h-1.5 w-1.5 rounded-pill ${item.autonomous ? 'bg-success' : 'bg-warning'}`}
                    aria-hidden
                  />
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ru })}
                </div>
              </div>
              <ChevronRight size={14} className="mt-0.5 shrink-0 text-muted opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>

      <AgentActivityDrawer item={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
