import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { AskAiButton } from '@/ai/components/AskAiButton'
import { SectionAnalyticsCard } from '@/ai/components/SectionAnalyticsCard'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { HelpButton } from '@/shared/ui/HelpButton'
import { KanbanBoard } from '@/shared/ui/KanbanBoard'
import { Input, Select } from '@/shared/ui/Field'
import { OnboardingDialog, OnboardingPage } from '@/shared/ui/OnboardingDialog'
import { useSectionOnboarding } from '@/shared/lib/useSectionOnboarding'
import { useTasksStore } from '../store'
import { TASK_STATES, Task } from '../types'
import { CreateTaskModal } from '../components/CreateTaskModal'
import { MyTasksPanel } from '../components/MyTasksPanel'
import { TaskDetailDrawer } from '../components/TaskDetailDrawer'

type SourceFilter = 'all' | 'manual' | 'clients' | 'production' | 'marketing' | 'warehouse'

function sourceOf(task: Task): SourceFilter {
  if (task.module_id !== null) return 'production'
  if (task.link_type === 'client_stage') return 'clients'
  if (task.link_type === 'content_stage') return 'marketing'
  if (task.link_type === 'warehouse_request' || task.link_type === 'warehouse_shortage') return 'warehouse'
  return 'manual'
}

const SOURCE_LABEL: Record<SourceFilter, string> = {
  all: 'Все разделы',
  manual: 'Ручная',
  clients: 'Клиенты',
  production: 'Производство',
  marketing: 'Маркетинг',
  warehouse: 'Склад',
}

type DateFilter = 'today' | 'week' | 'month' | 'year' | 'all'

const DATE_LABEL: Record<DateFilter, string> = {
  today: 'За сегодня',
  week: 'За эту неделю',
  month: 'За этот месяц',
  year: 'За этот год',
  all: 'За всё время',
}

/** Границы диапазона [начало, конец) по дедлайну задачи — null для "за всё время" (фильтр не применяется). */
function dateRange(filter: DateFilter): [Date, Date] | null {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  if (filter === 'today') return [new Date(y, m, d), new Date(y, m, d + 1)]
  if (filter === 'week') {
    const weekday = (now.getDay() + 6) % 7 // понедельник = 0
    return [new Date(y, m, d - weekday), new Date(y, m, d - weekday + 7)]
  }
  if (filter === 'month') return [new Date(y, m, 1), new Date(y, m + 1, 1)]
  if (filter === 'year') return [new Date(y, 0, 1), new Date(y + 1, 0, 1)]
  return null
}

function matchesDate(task: Task, range: [Date, Date] | null): boolean {
  if (!range) return true
  if (!task.deadline) return false
  const deadline = new Date(task.deadline)
  return deadline >= range[0] && deadline < range[1]
}

const ONBOARDING_PAGES: OnboardingPage[] = [
  {
    title: 'Общий борд задач',
    body: (
      <p>
        Здесь собраны задачи из всех разделов — производства, клиентов, маркетинга, склада — и задачи, созданные
        вручную. Доска разбита по колонкам-статусам, как в остальных разделах.
      </p>
    ),
  },
  {
    title: 'Мои задачи',
    body: (
      <p>
        Блок «Мои задачи» над доской показывает то, что назначено именно вам, — чтобы не искать среди общего
        потока.
      </p>
    ),
  },
  {
    title: 'Поиск и фильтры',
    body: (
      <p>
        Строка поиска ищет по названию и описанию. Рядом — фильтр по разделу-источнику задачи и по сроку
        (день, неделя, месяц, год и другие периоды). По умолчанию показывается этот месяц.
      </p>
    ),
  },
  {
    title: 'Новая задача и вопрос ИИ',
    body: (
      <p>
        Кнопка «Новая задача» создаёт ручную задачу. Кнопка «Спросить ИИ» открывает чат с контекстом раздела
        задач. Клик по карточке открывает детали и позволяет сменить статус.
      </p>
    ),
  },
]

export function TasksPage() {
  const tasks = useTasksStore((s) => s.tasks)
  const loading = useTasksStore((s) => s.loading)
  const load = useTasksStore((s) => s.load)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<Task | null>(null)
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [query, setQuery] = useState('')
  const onboarding = useSectionOnboarding('tasks')

  useEffect(() => {
    load()
  }, [load])

  const range = dateRange(dateFilter)
  const q = query.trim().toLowerCase()
  const filtered = tasks
    .filter((t) => sourceFilter === 'all' || sourceOf(t) === sourceFilter)
    .filter((t) => matchesDate(t, range))
    .filter((t) => !q || t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q))

  return (
    <div>
      <SectionAnalyticsCard section="tasks" />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-ink">Задачи</h1>
          <p className="mt-1 text-[13px] text-muted">Общий борд, включая задачи из других разделов</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          <AskAiButton domain="tasks" />
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} />
            Новая задача
          </Button>
          <HelpButton onClick={onboarding.show} />
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию и описанию…"
          className="sm:max-w-xs"
        />
        <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as SourceFilter)} className="w-full sm:w-44">
          {Object.entries(SOURCE_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)} className="w-full sm:w-44">
          {Object.entries(DATE_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <MyTasksPanel onOpenTask={setSelected} />

      <KanbanBoard
        columns={TASK_STATES}
        items={filtered}
        keyOf={(t) => String(t.id)}
        columnOf={(t) => t.status}
        onCardClick={setSelected}
        loading={loading}
        renderCard={(task) => (
          <div>
            <div className="text-[13px] font-medium text-ink">{task.title}</div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Chip tone="neutral">{SOURCE_LABEL[sourceOf(task)]}</Chip>
              {task.deadline && (
                <span className="text-[11px] text-muted">{new Date(task.deadline).toLocaleDateString('ru-RU')}</span>
              )}
            </div>
          </div>
        )}
      />

      <CreateTaskModal open={creating} onClose={() => setCreating(false)} />
      <TaskDetailDrawer task={selected} onClose={() => setSelected(null)} />

      <OnboardingDialog
        open={onboarding.open}
        onClose={onboarding.close}
        title="Раздел «Задачи»"
        pages={ONBOARDING_PAGES}
      />
    </div>
  )
}
