import { create } from 'zustand'
import { ApiError } from '@/shared/lib/httpClient'
import * as productionApi from './api'
import { CycleWithProduction, Module, Production } from './types'

export interface ActionResult {
  ok: boolean
  reason?: string
}

interface ProductionState {
  cycles: CycleWithProduction[]
  production: Production | null
  module: Module | null
  loading: boolean
  loadCycles: () => Promise<void>
  loadProduction: (id: number) => Promise<void>
  loadModule: (id: number) => Promise<void>
  createModule: (productionId: number, name: string, description?: string) => Promise<ActionResult>
  updateModule: (id: number, patch: { name?: string; description?: string }) => Promise<ActionResult>
  addModuleMaterial: (moduleId: number, input: productionApi.AddModuleMaterialInput) => Promise<ActionResult>
  updateModuleMaterial: (id: number, quantityRequired: number) => Promise<ActionResult>
  requestMaterial: (moduleMaterialId: number, quantity: number) => Promise<ActionResult>
}

function reasonOf(error: unknown): string {
  return error instanceof ApiError || error instanceof Error ? error.message : 'Не удалось выполнить действие'
}

export const useProductionStore = create<ProductionState>((set, get) => ({
  cycles: [],
  production: null,
  module: null,
  loading: true,

  loadCycles: async () => {
    const cycles = await productionApi.listCyclesWithProduction()
    set({ cycles, loading: false })
  },

  loadProduction: async (id) => {
    const production = await productionApi.getProduction(id)
    set({ production })
  },

  loadModule: async (id) => {
    const module = await productionApi.getModule(id)
    set({ module })
  },

  createModule: async (productionId, name, description) => {
    try {
      await productionApi.createModule(productionId, name, description)
      await get().loadProduction(productionId)
      return { ok: true }
    } catch (error) {
      return { ok: false, reason: reasonOf(error) }
    }
  },

  updateModule: async (id, patch) => {
    try {
      const module = await productionApi.updateModule(id, patch)
      set({ module })
      return { ok: true }
    } catch (error) {
      return { ok: false, reason: reasonOf(error) }
    }
  },

  addModuleMaterial: async (moduleId, input) => {
    try {
      await productionApi.addModuleMaterial(moduleId, input)
      await get().loadModule(moduleId)
      return { ok: true }
    } catch (error) {
      return { ok: false, reason: reasonOf(error) }
    }
  },

  updateModuleMaterial: async (id, quantityRequired) => {
    try {
      const current = get().module
      await productionApi.updateModuleMaterial(id, quantityRequired)
      if (current) await get().loadModule(current.id)
      return { ok: true }
    } catch (error) {
      return { ok: false, reason: reasonOf(error) }
    }
  },

  requestMaterial: async (moduleMaterialId, quantity) => {
    try {
      const current = get().module
      await productionApi.requestMaterial(moduleMaterialId, quantity)
      if (current) await get().loadModule(current.id)
      return { ok: true }
    } catch (error) {
      return { ok: false, reason: reasonOf(error) }
    }
  },
}))
