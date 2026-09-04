/**
 * Общая шина синхронизации задач между разделами (Клиенты, Производство,
 * Маркетинг, Склад) и разделом «Задачи» — единственная связь между этими
 * разделами и tasks/. Ни один из них не импортирует tasks/ напрямую.
 *
 * Правило синхронизации (обе стороны):
 *  1. Домен переходит на новую стадию → requestSyncTask(...) открывает в
 *     Задачах новую задачу «обработать следующий шаг», привязанную к
 *     записи источника. Сторона, инициировавшая переход через экран
 *     самого раздела, сама закрывает предыдущую задачу через
 *     requestCloseSyncedTask(...).
 *  2. Пользователь закрывает привязанную задачу прямо в Задачах →
 *     tasks/store вызывает resolveSyncedTask(...); домен-источник
 *     регистрирует свой resolver через registerSyncResolver(...) и внутри
 *     него пытается выполнить тот же переход стадии, что и кнопка в его
 *     собственном экране. Если обязательные поля ещё не заполнены —
 *     resolver возвращает ok:false, и задача в Задачах остаётся открытой.
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

export interface SyncResolution {
  ok: boolean
  reason?: string
}

type Unsubscribe = () => void
type Resolver = (sourceRefId: string) => SyncResolution

const resolvers = new Map<SyncSection, Resolver>()
const createListeners = new Set<(req: SyncTaskRequest) => void>()
const closeListeners = new Set<(source: SyncSection, sourceRefId: string) => void>()

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

/** Домен-источник регистрирует, как проверить/выполнить переход по ссылке из задачи. */
export function registerSyncResolver(source: SyncSection, resolver: Resolver): void {
  resolvers.set(source, resolver)
}

/** tasks/store вызывает это при попытке закрыть привязанную задачу вручную. */
export function resolveSyncedTask(source: SyncSection, sourceRefId: string): SyncResolution {
  const resolver = resolvers.get(source)
  if (!resolver) return { ok: true }
  return resolver(sourceRefId)
}
