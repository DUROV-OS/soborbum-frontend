import { create } from 'zustand'
import { useAuthStore } from '@/auth/store'
import { onSyncedTaskShouldClose, onSyncTaskRequested } from '@/shared/lib/taskSync'
import * as tasksApi from './api'
import { Task, TaskState } from './types'

interface TasksState {
  tasks: Task[]
  loading: boolean
  load: () => Promise<void>
  create: (input: tasksApi.CreateTaskInput) => void
  transition: (id: string, target: TaskState) => tasksApi.TransitionResult
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  loading: true,

  load: async () => {
    const tasks = await tasksApi.listTasks()
    set({ tasks, loading: false })
  },

  create: (input) => {
    tasksApi.createTask(input)
    set({ tasks: [...tasksApi.getTasksSnapshot()] })
  },

  transition: (id, target) => {
    const account = useAuthStore.getState().accounts.find(
      (a) => a.id === useAuthStore.getState().currentAccountId,
    )
    if (!account) return { ok: false, reason: 'Нет активной учётной записи' }
    const result = tasksApi.transitionTask(id, target, account)
    set({ tasks: [...tasksApi.getTasksSnapshot()] })
    return result
  },
}))

/** Раздел «Задачи» отражает изменения, вызванные другими доменами через шину синхронизации. */
function refreshTasksFromBus() {
  useTasksStore.setState({ tasks: [...tasksApi.getTasksSnapshot()] })
}

onSyncTaskRequested(() => refreshTasksFromBus())
onSyncedTaskShouldClose(() => refreshTasksFromBus())
