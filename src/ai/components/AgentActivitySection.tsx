import { useEffect, useState } from 'react'
import { Bot, Sparkles } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { useAiStore } from '../store'
import { AgentActivityOut } from '../types'
import { AgentActivityDrawer } from './AgentActivityDrawer'

/** «Действия агента» — только для чтения лог того, что агент сделал сам (см.
 * предложение в задаче 0007). Не привязан к открытому чату — общий поток,
 * поэтому вынесен из чата отдельным блоком под ним, а не боковой колонкой —
 * так же виден и на мобильной ширине. Верхняя карточка — по образцу блока
 * «Марина» на «Пульсе» (`src/today/pages/TodayPage.tsx`). Сейчас наполняется
 * только демо-данными на localhost (задача 0033). */
export function AgentActivitySection() {
  const agentActivity = useAiStore((s) => s.agentActivity)
  const loading = useAiStore((s) => s.agentActivityLoading)
  const loadAgentActivity = useAiStore((s) => s.loadAgentActivity)
  const [selected, setSelected] = useState<AgentActivityOut | null>(null)

  useEffect(() => {
    loadAgentActivity()
  }, [loadAgentActivity])

  return (
    <section aria-labelledby="agent-activity-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-ai/30 bg-ai-bg p-5 text-ink sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ai/15">
            <Sparkles size={22} className="text-ai-accent" />
          </div>
          <div>
            <h2 id="agent-activity-title" className="text-[21px] font-medium tracking-tight">
              Действия агента
            </h2>
            <p className="text-[12px] text-muted">Что Марина сделала сама — последние шаги и решения</p>
          </div>
        </div>
        {agentActivity.length > 0 && (
          <span className="shrink-0 self-start rounded-lg bg-surface px-3 py-1.5 text-[13px] font-medium text-ink sm:self-auto">
            {agentActivity.length} за последнее время
          </span>
        )}
      </div>

      {loading && agentActivity.length === 0 && <LoadingState label="Загрузка…" />}
      {!loading && agentActivity.length === 0 && (
        <EmptyState
          icon={<Bot size={22} />}
          title="Пока пусто"
          description="Здесь появится лог того, что агент сделал сам."
        />
      )}

      {agentActivity.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {agentActivity.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="flex flex-col items-start gap-2 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-ai/40 hover:bg-ai/5"
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-pill ${item.autonomous ? 'bg-success' : 'bg-warning'}`}
                  aria-hidden
                />
                <span className="text-[11px] text-muted">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ru })}
                </span>
              </div>
              <div className="line-clamp-2 text-[13px] font-medium text-ink">{item.title}</div>
              <p className="line-clamp-2 text-[12px] leading-relaxed text-muted">{item.detail}</p>
            </button>
          ))}
        </div>
      )}

      <AgentActivityDrawer item={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
