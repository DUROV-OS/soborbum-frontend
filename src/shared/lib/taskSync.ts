/**
 * Общая шина синхронизации задач между разделами (Клиенты, Производство,
 * Маркетинг, Склад) и разделом «Задачи» — единственная связь между этими
 * разделами. Ни один раздел не импортирует другой напрямую: домены
 * публикуют события через эту шину, а tasks/store.ts на них подписан.
 *
 * Поток:
 *  1. Домен переходит на новую стадию → requestSyncTask(...) → в Задачах
 *     появляется новая задача с привязкой к источнику.
 *  2. Пользователь закрывает такую задачу в Задачах → tasks/store.ts
 *     вызывает emitTaskCompleted(...) → домен-источник подписан и сам
 *     выполняет авто-переход на следующую стадию.
 *  3. Если домен меняет стадию другим способом (не через задачу) — он
 *     вызывает requestCloseSyncedTask(...), чтобы закрыть «повисшую» задачу.
 */

export type SyncSection = 'clients' | 'production' | 'marketing' | 'warehouse'

export interface SyncTaskRequest {
  source: SyncSection
  sourceRefId: string
  title: string
  description?: string
  dueDate?: string
  /** Раздел доступа, из которого можно назначить исполнителя */
  assigneeAccessSection: SyncSection
}

export interface SyncTaskCompletedEvent {
  source: SyncSection
  sourceRefId: string
}

type Unsubscribe = () => void

const createListeners = new Set<(req: SyncTaskRequest) => void>()
const closeListeners = new Set<(source: SyncSection, sourceRefId: string) => void>()
const completedListeners = new Set<(event: SyncTaskCompletedEvent) => void>()

export function requestSyncTask(req: SyncTaskRequest): void {
  createListeners.forEach((listener) => listener(req))
}

export function onSyncTaskRequested(fn: (req: SyncTaskRequest) => void): Unsubscribe {
  createListeners.add(fn)
  return () => createListeners.delete(fn)
}

export function requestCloseSyncedTask(source: SyncSection, sourceRefId: string): void {
  closeListeners.forEach((listener) => listener(source, sourceRefId))
}

export function onSyncedTaskShouldClose(
  fn: (source: SyncSection, sourceRefId: string) => void,
): Unsubscribe {
  closeListeners.add(fn)
  return () => closeListeners.delete(fn)
}

export function emitSyncedTaskCompleted(event: SyncTaskCompletedEvent): void {
  completedListeners.forEach((listener) => listener(event))
}

export function onSyncedTaskCompleted(
  fn: (event: SyncTaskCompletedEvent) => void,
): Unsubscribe {
  completedListeners.add(fn)
  return () => completedListeners.delete(fn)
}
