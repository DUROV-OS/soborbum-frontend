import { create } from 'zustand'
import { ApiError } from '@/shared/lib/httpClient'
import * as todayApi from './api'
import { TodayDashboard } from './types'

function reasonOf(error: unknown): string {
  return error instanceof ApiError || error instanceof Error ? error.message : 'Не удалось загрузить сводку'
}

interface TodayState {
  data: TodayDashboard | null
  loading: boolean
  error: string | null
  load: (reload?: boolean) => Promise<void>
}

export const useTodayStore = create<TodayState>((set) => ({
  data: null,
  loading: true,
  error: null,

  load: async (reload = false) => {
    set({ loading: true, error: null })
    try {
      const data = await todayApi.getToday(reload)
      set({ data, loading: false })
    } catch (error) {
      set({ error: reasonOf(error), loading: false })
    }
  },
}))
