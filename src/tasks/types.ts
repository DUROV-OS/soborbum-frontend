import { Attachment } from '@/shared/ui/FileDrop'
import { SyncSection } from '@/shared/lib/taskSync'

export type TaskState = 'not_ready' | 'ready' | 'in_progress' | 'in_review' | 'done'

export const TASK_STATES: { key: TaskState; label: string }[] = [
  { key: 'not_ready', label: 'Не готова к работе' },
  { key: 'ready', label: 'Готова к работе' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'in_review', label: 'На проверке' },
  { key: 'done', label: 'Выполнена' },
]

export type TaskSource = 'manual' | SyncSection | 'production'

export interface SyncRef {
  source: SyncSection
  sourceRefId: string
}

export interface Task {
  id: string
  title: string
  description?: string
  dueDate?: string
  images: Attachment[]
  dependsOn: string[]
  state: TaskState
  /** Конкретные исполнители — для ручных задач и задач производства */
  assigneeIds: string[]
  /** Конкретные проверяющие (опционально) */
  checkerIds: string[]
  /** Для синк-задач: пул исполнителей — любой сотрудник с доступом к разделу, а не конкретные люди */
  assigneeAccessSection?: SyncSection
  source: TaskSource
  moduleId?: string
  syncRef?: SyncRef
  createdAt: string
}
