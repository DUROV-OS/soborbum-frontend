import { create } from 'zustand'
import { ApiError } from '@/shared/lib/httpClient'
import * as suppliersApi from './api'
import { Supplier } from './types'

export interface ActionResult {
  ok: boolean
  reason?: string
}

function reasonOf(error: unknown): string {
  return error instanceof ApiError || error instanceof Error ? error.message : 'Не удалось выполнить действие'
}

interface SuppliersState {
  suppliers: Supplier[]
  loading: boolean
  /** Ошибка загрузки списка (напр. нет доступа к разделу склада). */
  loadError: string | null
  load: () => Promise<void>
  create: (input: suppliersApi.SupplierCreateInput) => Promise<ActionResult>
  update: (id: number, patch: suppliersApi.SupplierUpdateInput) => Promise<ActionResult>
  remove: (id: number) => Promise<ActionResult>
  addPriceItem: (id: number, input: suppliersApi.PriceItemInput) => Promise<ActionResult>
  updatePriceItem: (
    id: number,
    itemId: number,
    patch: Partial<suppliersApi.PriceItemInput>,
  ) => Promise<ActionResult>
  removePriceItem: (id: number, itemId: number) => Promise<ActionResult>
  linkChat: (id: number, chatId: number) => Promise<ActionResult>
  unlinkChat: (id: number) => Promise<ActionResult>
}

export const useSuppliersStore = create<SuppliersState>((set, get) => {
  const replace = (updated: Supplier) =>
    set({ suppliers: get().suppliers.map((s) => (s.id === updated.id ? updated : s)) })

  return {
    suppliers: [],
    loading: true,
    loadError: null,

    load: async () => {
      set({ loading: true, loadError: null })
      try {
        const suppliers = await suppliersApi.listSuppliers()
        set({ suppliers, loading: false })
      } catch (error) {
        set({ loading: false, loadError: reasonOf(error) })
      }
    },

    create: async (input) => {
      try {
        const supplier = await suppliersApi.createSupplier(input)
        set({ suppliers: [...get().suppliers, supplier].sort((a, b) => a.name.localeCompare(b.name, 'ru')) })
        return { ok: true }
      } catch (error) {
        return { ok: false, reason: reasonOf(error) }
      }
    },

    update: async (id, patch) => {
      try {
        replace(await suppliersApi.updateSupplier(id, patch))
        return { ok: true }
      } catch (error) {
        return { ok: false, reason: reasonOf(error) }
      }
    },

    remove: async (id) => {
      try {
        await suppliersApi.deleteSupplier(id)
        set({ suppliers: get().suppliers.filter((s) => s.id !== id) })
        return { ok: true }
      } catch (error) {
        return { ok: false, reason: reasonOf(error) }
      }
    },

    addPriceItem: async (id, input) => {
      try {
        replace(await suppliersApi.addPriceItem(id, input))
        return { ok: true }
      } catch (error) {
        return { ok: false, reason: reasonOf(error) }
      }
    },

    updatePriceItem: async (id, itemId, patch) => {
      try {
        replace(await suppliersApi.updatePriceItem(id, itemId, patch))
        return { ok: true }
      } catch (error) {
        return { ok: false, reason: reasonOf(error) }
      }
    },

    removePriceItem: async (id, itemId) => {
      try {
        await suppliersApi.deletePriceItem(id, itemId)
        await get().load()
        return { ok: true }
      } catch (error) {
        return { ok: false, reason: reasonOf(error) }
      }
    },

    linkChat: async (id, chatId) => {
      try {
        replace(await suppliersApi.linkMaxChat(id, chatId))
        return { ok: true }
      } catch (error) {
        return { ok: false, reason: reasonOf(error) }
      }
    },

    unlinkChat: async (id) => {
      try {
        replace(await suppliersApi.unlinkMaxChat(id))
        return { ok: true }
      } catch (error) {
        return { ok: false, reason: reasonOf(error) }
      }
    },
  }
})
