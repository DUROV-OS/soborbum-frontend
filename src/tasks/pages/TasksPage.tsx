import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { AskAiButton } from '@/ai/components/AskAiButton'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { KanbanBoard } from '@/shared/ui/KanbanBoard'
import { Select } from '@/shared/ui/Field'
import { useTasksStore } from '../store'
import { TASK_STATES, Task } from '../types'
import { CreateTaskModal } from '../components/CreateTaskModal'
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

export function TasksPage() {
  const tasks = useTasksStore((s) => s.tasks)
  const load = useTasksStore((s) => s.load)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<Task | null>(null)
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')

  useEffect(() => {
    load()
  }, [load])

  const filtered = sourceFilter === 'all' ? tasks : tasks.filter((t) => sourceOf(t) === sourceFilter)

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-ink">Задачи</h1>
          <p className="mt-1 text-[13px] text-muted">Общий борд, включая задачи из других разделов</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as SourceFilter)} className="w-full sm:w-44">
            {Object.entries(SOURCE_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
          <AskAiButton domain="tasks" />
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} />
            Новая задача
          </Button>
        </div>
      </div>

      <KanbanBoard
        columns={TASK_STATES}
        items={filtered}
        keyOf={(t) => String(t.id)}
        columnOf={(t) => t.status}
        onCardClick={setSelected}
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
    </div>
  )
}
