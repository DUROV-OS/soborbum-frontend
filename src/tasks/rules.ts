import { Account } from '@/auth/types'
import { Task, TaskState } from './types'

export function canActAsAssignee(task: Task, account: Account): boolean {
  if (account.role === 'admin') return true
  if (task.assigneeAccessSection) return account.sectionAccess.includes(task.assigneeAccessSection)
  return task.assigneeIds.includes(account.id)
}

export function canActAsChecker(task: Task, account: Account): boolean {
  if (account.role === 'admin') return true
  return task.checkerIds.includes(account.id)
}

export interface TransitionCheck {
  ok: boolean
  reason?: string
}

/** Разрешён ли переход task.state -> target для данного аккаунта (без учёта каскада авто-завершения) */
export function checkTransition(task: Task, target: TaskState, account: Account): TransitionCheck {
  if (task.state === 'ready' && target === 'in_progress') {
    return canActAsAssignee(task, account)
      ? { ok: true }
      : { ok: false, reason: 'Взять задачу в работу может только исполнитель' }
  }
  if (task.state === 'in_progress' && target === 'in_review') {
    return canActAsAssignee(task, account)
      ? { ok: true }
      : { ok: false, reason: 'Отправить на проверку может только исполнитель' }
  }
  if (task.state === 'in_review' && target === 'in_progress') {
    if (task.checkerIds.length === 0) return { ok: false, reason: 'У задачи нет проверяющего' }
    return canActAsChecker(task, account)
      ? { ok: true }
      : { ok: false, reason: 'Вернуть в работу может только проверяющий' }
  }
  if (task.state === 'in_review' && target === 'done') {
    if (task.checkerIds.length === 0) return { ok: true }
    return canActAsChecker(task, account)
      ? { ok: true }
      : { ok: false, reason: 'Завершить задачу может только проверяющий' }
  }
  return { ok: false, reason: 'Такой переход недопустим' }
}

export function dependenciesSatisfied(task: Task, allTasks: Task[]): boolean {
  return task.dependsOn.every((depId) => allTasks.find((t) => t.id === depId)?.state === 'done')
}
