import { create } from 'zustand'
import * as cyclesApi from './api'
import { Cycle } from './types'

interface CyclesState {
  cycles: Cycle[]
  loading: boolean
  load: () => Promise<void>
}

export const useCyclesStore = create<CyclesState>((set) => ({
  cycles: [],
  loading: true,

  load: async () => {
    const cycles = await cyclesApi.listCycles()
    set({ cycles, loading: false })
  },
}))
