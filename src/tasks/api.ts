import { generateId, nowIso, withLatency } from '@/shared/lib/mockApi'
import { loadState, saveState } from '@/shared/lib/storage'
import {
  onSyncedTaskShouldClose,
  onSyncTaskRequested,
  resolveSyncedTask,
} from '@/shared/lib/taskSync'
import { Account } from '@/auth/types'
import { SEED_TASKS } from './mock'
import { checkTransition } from './rules'
import { Task, TaskState } from './types'

const STORAGE_KEY = 'soborbum.tasks'

let tasks: Task[] = loadState(STORAGE_KEY, SEED_TASKS)

function persist() {
  saveState(STORAGE_KEY, tasks)
}

function find(id: string): Task {
  const task = tasks.find((t) => t.id === id)
  if (!task) throw new Error('Задача не найдена')
  return task
}

function recomputeReadiness() {
  let changed = true
  let guard = 0
  while (changed && guard < 20) {
    changed = false
    guard += 1
    tasks = tasks.map((task) => {
      if (task.state !== 'not_ready') return task
      const satisfied = task.dependsOn.every((depId) => tasks.find((t) => t.id === depId)?.state === 'done')
      if (satisfied) {
        changed = true
        return { ...task, state: 'ready' as TaskState }
      }
      return task
    })
  }
}
recomputeReadiness()

export interface CreateTaskInput {
  title: string
  description?: string
  dueDate?: string
  dependsOn: string[]
  assigneeIds: string[]
  checkerIds: string[]
  images?: Task['images']
  source?: Task['source']
  moduleId?: string
  syncRef?: Task['syncRef']
  assigneeAccessSection?: Task['assigneeAccessSection']
}

/** POST /api/tasks */
export function createTask(input: CreateTaskInput): Task {
  const hasDeps = input.dependsOn.length > 0
  const task: Task = {
    id: generateId('task'),
    title: input.title,
    description: input.description,
    dueDate: input.dueDate,
    images: input.images ?? [],
    dependsOn: input.dependsOn,
    state: hasDeps ? 'not_ready' : 'ready',
    assigneeIds: input.assigneeIds,
    checkerIds: input.checkerIds,
    assigneeAccessSection: input.assigneeAccessSection,
    source: input.source ?? 'manual',
    moduleId: input.moduleId,
    syncRef: input.syncRef,
    createdAt: nowIso(),
  }
  tasks = [task, ...tasks]
  recomputeReadiness()
  persist()
  return task
}

/** GET /api/tasks */
export function listTasks(): Promise<Task[]> {
  return withLatency([...tasks])
}

export interface TransitionResult {
  ok: boolean
  reason?: string
}

function finalizeDone(task: Task): TransitionResult {
  if (task.syncRef) {
    const resolution = resolveSyncedTask(task.syncRef.source, task.syncRef.sourceRefId)
    if (!resolution.ok) return { ok: false, reason: resolution.reason }
  }
  task.state = 'done'
  recomputeReadiness()
  persist()
  return { ok: true }
}

/** POST /api/tasks/:id/transition */
export function transitionTask(id: string, target: TaskState, account: Account): TransitionResult {
  const task = find(id)
  const check = checkTransition(task, target, account)
  if (!check.ok) return { ok: false, reason: check.reason }

  if (target === 'done') return finalizeDone(task)

  task.state = target
  persist()

  if (target === 'in_review' && task.checkerIds.length === 0) {
    return finalizeDone(task)
  }
  return { ok: true }
}

export function listTasksByModule(moduleId: string): Task[] {
  return tasks.filter((t) => t.moduleId === moduleId)
}

export function getTasksSnapshot(): Task[] {
  return tasks
}

onSyncTaskRequested((req) => {
  createTask({
    title: req.title,
    description: req.description,
    dueDate: req.dueDate,
    dependsOn: [],
    assigneeIds: [],
    checkerIds: [],
    assigneeAccessSection: req.assigneeAccessSection,
    source: req.source,
    syncRef: { source: req.source, sourceRefId: req.sourceRefId },
  })
})

onSyncedTaskShouldClose((source, sourceRefId) => {
  const open = tasks.find(
    (t) => t.syncRef?.source === source && t.syncRef?.sourceRefId === sourceRefId && t.state !== 'done',
  )
  if (open) {
    open.state = 'done'
    recomputeReadiness()
    persist()
  }
})
