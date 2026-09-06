import { create } from 'zustand'
import { ApiError } from '@/shared/lib/httpClient'
import * as agentsApi from './api'
import { AgentRun, AgentsStats } from './types'

function reasonOf(error: unknown): string {
  return error instanceof ApiError || error instanceof Error ? error.message : 'Не удалось выполнить запрос'
}

interface AgentsState {
  stats: AgentsStats | null
  statsLoading: boolean
  statsError: string | null
  lastRun: AgentRun | null
  runLoading: boolean
  runError: string | null
  loadStats: () => Promise<void>
  submit: (text: string) => Promise<AgentRun | null>
}

export const useAgentsStore = create<AgentsState>((set, get) => ({
  stats: null,
  statsLoading: false,
  statsError: null,
  lastRun: null,
  runLoading: false,
  runError: null,

  loadStats: async () => {
    set({ statsLoading: true, statsError: null })
    try {
      const stats = await agentsApi.getAgentStats()
      set({ stats, statsLoading: false })
    } catch (error) {
      set({ statsError: reasonOf(error), statsLoading: false })
    }
  },

  submit: async (text: string) => {
    set({ runLoading: true, runError: null })
    try {
      const lastRun = await agentsApi.createAgentRun(text)
      set({ lastRun, runLoading: false })
      if (get().stats !== null || get().statsError) {
        void get().loadStats()
      }
      return lastRun
    } catch (error) {
      set({ runError: reasonOf(error), runLoading: false })
      return null
    }
  },
}))
