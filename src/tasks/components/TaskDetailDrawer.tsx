import { useState } from 'react'
import { useAuthStore } from '@/auth/store'
import { Chip } from '@/shared/ui/Chip'
import { Button } from '@/shared/ui/Button'
import { Drawer } from '@/shared/ui/Drawer'
import { sectionById } from '@/shared/sections'
import { useTasksStore } from '../store'
import { Task, TASK_STATES } from '../types'
import { stateTone } from './stateTone'

export function TaskDetailDrawer({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const accounts = useAuthStore((s) => s.accounts)
  const transition = useTasksStore((s) => s.transition)
  const [error, setError] = useState<string | null>(null)

  if (!task) return null

  const taskId = task.id

  function nameOf(accountId: string) {
    return accounts.find((a) => a.id === accountId)?.name ?? accountId
  }

  function act(target: Task['state']) {
    const result = transition(taskId, target)
    setError(result.ok ? null : result.reason ?? 'Действие недоступно')
  }

  const stateLabel = TASK_STATES.find((s) => s.key === task.state)?.label ?? task.state

  return (
    <Drawer open={!!task} onClose={onClose} title={task.title} subtitle={<Chip tone={stateTone(task.state)}>{stateLabel}</Chip>}>
      <div className="flex flex-col gap-5">
        {task.description && <p className="text-[13px] text-ink">{task.description}</p>}

        {task.dueDate && (
          <Row label="Дедлайн" value={new Date(task.dueDate).toLocaleDateString('ru-RU')} />
        )}

        <Row
          label="Исполнитель"
          value={
            task.assigneeAccessSection
              ? `Любой сотрудник с доступом: ${sectionById(task.assigneeAccessSection).label}`
              : task.assigneeIds.map(nameOf).join(', ') || '—'
          }
        />
        <Row label="Проверяющий" value={task.checkerIds.map(nameOf).join(', ') || 'нет — проверка не требуется'} />

        {task.dependsOn.length > 0 && (
          <Row label="Зависит от" value={`${task.dependsOn.length} задач(и)`} />
        )}

        {task.images.length > 0 && (
          <div>
            <div className="mb-1.5 text-[13px] text-muted">Изображения</div>
            <div className="flex flex-col gap-1">
              {task.images.map((img) => (
                <div key={img.name} className="text-[13px] text-ink">
                  {img.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-[12px] text-danger">{error}</p>}

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          {task.state === 'ready' && (
            <Button size="sm" onClick={() => act('in_progress')}>
              Взять в работу
            </Button>
          )}
          {task.state === 'in_progress' && (
            <Button size="sm" onClick={() => act('in_review')}>
              Отправить на проверку
            </Button>
          )}
          {task.state === 'in_review' && (
            <>
              <Button size="sm" onClick={() => act('done')}>
                Принять — выполнена
              </Button>
              <Button size="sm" variant="secondary" onClick={() => act('in_progress')}>
                Вернуть в работу
              </Button>
            </>
          )}
          {task.state === 'not_ready' && (
            <p className="text-[12px] text-muted">
              Задача откроется автоматически, когда будут выполнены задачи, от которых она зависит.
            </p>
          )}
          {task.state === 'done' && <p className="text-[12px] text-muted">Задача выполнена.</p>}
        </div>
      </div>
    </Drawer>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-[13px]">
      <span className="text-muted">{label}</span>
      <span className="text-right text-ink">{value}</span>
    </div>
  )
}
