import { useState } from 'react'
import { useAuthStore } from '@/auth/store'
import { Button } from '@/shared/ui/Button'
import { Field, Input, Textarea } from '@/shared/ui/Field'
import { Modal } from '@/shared/ui/Modal'
import { useTasksStore } from '../store'
import { Task } from '../types'

export function CreateTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const accounts = useAuthStore((s) => s.accounts)
  const tasks = useTasksStore((s) => s.tasks)
  const create = useTasksStore((s) => s.create)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [checkerIds, setCheckerIds] = useState<string[]>([])
  const [dependsOn, setDependsOn] = useState<string[]>([])

  const valid = title.trim().length > 0 && assigneeIds.length > 0

  function reset() {
    setTitle('')
    setDescription('')
    setDueDate('')
    setAssigneeIds([])
    setCheckerIds([])
    setDependsOn([])
  }

  function toggle(list: string[], id: string, setter: (v: string[]) => void) {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  function handleSubmit() {
    if (!valid) return
    create({
      title,
      description: description || undefined,
      dueDate: dueDate || undefined,
      assigneeIds,
      checkerIds,
      dependsOn,
    })
    reset()
    onClose()
  }

  const openDependencyOptions: Task[] = tasks.filter((t) => t.state !== 'done')

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Новая задача"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!valid}>
            Создать
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Название" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: подготовить смету" />
        </Field>
        <Field label="Описание">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Дедлайн">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Исполнители" required hint="Любой из них может взять задачу в работу">
          <div className="flex flex-col gap-1.5">
            {accounts.map((account) => (
              <label key={account.id} className="flex items-center gap-2 text-[13px] text-ink">
                <input
                  type="checkbox"
                  checked={assigneeIds.includes(account.id)}
                  onChange={() => toggle(assigneeIds, account.id, setAssigneeIds)}
                  className="h-4 w-4 accent-[#395b4b]"
                />
                {account.name}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Проверяющие" hint="Необязательно — без проверяющего задача завершается автоматически">
          <div className="flex flex-col gap-1.5">
            {accounts.map((account) => (
              <label key={account.id} className="flex items-center gap-2 text-[13px] text-ink">
                <input
                  type="checkbox"
                  checked={checkerIds.includes(account.id)}
                  onChange={() => toggle(checkerIds, account.id, setCheckerIds)}
                  className="h-4 w-4 accent-[#395b4b]"
                />
                {account.name}
              </label>
            ))}
          </div>
        </Field>
        {openDependencyOptions.length > 0 && (
          <Field label="Зависит от" hint="Задача станет доступна после выполнения выбранных">
            <div className="flex flex-col gap-1.5">
              {openDependencyOptions.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-[13px] text-ink">
                  <input
                    type="checkbox"
                    checked={dependsOn.includes(t.id)}
                    onChange={() => toggle(dependsOn, t.id, setDependsOn)}
                    className="h-4 w-4 accent-[#395b4b]"
                  />
                  {t.title}
                </label>
              ))}
            </div>
          </Field>
        )}
      </div>
    </Modal>
  )
}
