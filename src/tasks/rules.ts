import { Account } from '@/auth/types'
import { Task } from './types'

/**
 * Точное разрешение на переход проверяет бэкенд (403/400 на PATCH .../status).
 * Здесь — только ориентировочная проверка для расстановки кнопок в интерфейсе.
 */
export function isAssignee(task: Task, account: Account): boolean {
  return account.role === 'admin' || task.assignees.some((a) => a.id === account.id)
}

export function isReviewer(task: Task, account: Account): boolean {
  return account.role === 'admin' || task.reviewers.some((a) => a.id === account.id)
}
