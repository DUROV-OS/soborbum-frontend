import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { KanbanBoard } from '@/shared/ui/KanbanBoard'
import { Select } from '@/shared/ui/Field'
import { sectionById } from '@/shared/sections'
import { useTasksStore } from '../store'
import { TASK_STATES, Task, TaskSource } from '../types'
import { CreateTaskModal } from '../components/CreateTaskModal'
import { TaskDetailDrawer } from '../components/TaskDetailDrawer'

const SOURCE_LABEL: Record<TaskSource, string> = {
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
  const [sourceFilter, setSourceFilter] = useState<'all' | TaskSource>('all')

  useEffect(() => {
    load()
  }, [load])

  const filtered = sourceFilter === 'all' ? tasks : tasks.filter((t) => t.source === sourceFilter)

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-ink">Задачи</h1>
          <p className="mt-1 text-[13px] text-muted">Общий борд, включая задачи из других разделов</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as 'all' | TaskSource)} className="w-44">
            <option value="all">Все разделы</option>
            {Object.entries(SOURCE_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} />
            Новая задача
          </Button>
        </div>
      </div>

      <KanbanBoard
        columns={TASK_STATES}
        items={filtered}
        keyOf={(t) => t.id}
        columnOf={(t) => t.state}
        onCardClick={setSelected}
        renderCard={(task) => (
          <div>
            <div className="text-[13px] font-medium text-ink">{task.title}</div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Chip tone="neutral">{task.source === 'clients' && task.assigneeAccessSection ? sectionById(task.assigneeAccessSection).label : SOURCE_LABEL[task.source]}</Chip>
              {task.dueDate && (
                <span className="text-[11px] text-muted">{new Date(task.dueDate).toLocaleDateString('ru-RU')}</span>
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
