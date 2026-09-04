import { useEffect } from 'react'
import { AlertCircle, CalendarDays, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Markdown } from '@/shared/ui/Markdown'
import { StatWidget } from '@/shared/ui/StatWidget'
import { useTodayStore } from '../store'

const SECTION_LABELS: Record<string, string> = {
  clients: 'Клиенты',
  production: 'Производство',
  installation: 'Монтаж',
  cycle: 'Цикл клиента',
  warehouse: 'Склад',
  marketing: 'Маркетинг',
  tasks: 'Задачи',
  users: 'Сотрудники',
}

function sectionLabel(section: string): string {
  return SECTION_LABELS[section] ?? section
}

export function TodayPage() {
  const data = useTodayStore((s) => s.data)
  const loading = useTodayStore((s) => s.loading)
  const error = useTodayStore((s) => s.error)
  const load = useTodayStore((s) => s.load)

  useEffect(() => {
    load()
  }, [load])

  const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  const sections: string[] = []
  for (const widget of data?.widgets ?? []) {
    if (!sections.includes(widget.section)) sections.push(widget.section)
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-ink">Сегодня</h1>
          <p className="mt-1 text-[13px] text-muted capitalize">{today}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => load()} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Обновить
        </Button>
      </div>

      {loading && !data && (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border px-6 py-14 text-center text-[13px] text-muted">
          Собираем сводку по предприятию…
        </div>
      )}

      {error && (
        <EmptyState
          icon={<AlertCircle size={28} />}
          title="Не удалось загрузить сводку"
          description={error}
          action={
            <Button size="sm" onClick={() => load()}>
              Повторить
            </Button>
          }
        />
      )}

      {!loading && !error && data && (
        <div className="flex flex-col gap-6">
          <div className="rounded-md border border-border bg-surface p-4 text-[14px] text-ink">
            {data.summary ? <Markdown text={data.summary} /> : 'Сводка пуста.'}
          </div>

          {sections.length === 0 && (
            <EmptyState
              icon={<CalendarDays size={28} />}
              title="Пока нечего показать"
              description="Нет ни одного раздела с данными для сводки."
            />
          )}

          {sections.map((section) => (
            <div key={section}>
              <h2 className="mb-2 text-[13px] font-medium text-muted">{sectionLabel(section)}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.widgets
                  .filter((w) => w.section === section)
                  .map((widget, index) => (
                    <StatWidget
                      key={`${section}-${index}`}
                      label={widget.title}
                      value={widget.value}
                      hint={widget.hint ?? undefined}
                      tone={widget.tone}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
