import { create } from 'zustand'
import { listClients } from '@/clients/api'
import { ApiError } from '@/shared/lib/httpClient'
import { DateFilter, dateFilterRange } from '@/shared/lib/dateFilter'
import * as accountingApi from './api'
import { MoneyMovementCreateInput } from './api'
import {
  MoneyDirection,
  MoneyMovement,
  MoneyMovementEnums,
  MoneyMovementStatus,
  MoneySourceKind,
  MoneySubkind,
} from './types'

export interface ActionResult {
  ok: boolean
  reason?: string
}

export interface ClientOption {
  id: number
  name: string
}

export interface MovementFilters {
  direction: MoneyDirection | 'all'
  subkind: MoneySubkind | 'all'
  status: MoneyMovementStatus | 'all'
  source_kind: MoneySourceKind | 'all'
  period: DateFilter
}

const DEFAULT_FILTERS: MovementFilters = {
  direction: 'all',
  subkind: 'all',
  status: 'all',
  source_kind: 'all',
  period: 'all',
}

interface AccountingState {
  movements: MoneyMovement[]
  enums: MoneyMovementEnums | null
  clients: ClientOption[]
  loading: boolean
  filters: MovementFilters
  load: () => Promise<void>
  setFilters: (patch: Partial<MovementFilters>) => void
  resetFilters: () => void
  create: (input: MoneyMovementCreateInput) => Promise<ActionResult>
  changeStatus: (
    id: number,
    to: Exclude<MoneyMovementStatus, 'draft'>,
    reason?: string,
  ) => Promise<ActionResult>
  remove: (id: number) => Promise<ActionResult>
}

function reasonOf(error: unknown): string {
  return error instanceof ApiError || error instanceof Error
    ? error.message
    : 'Не удалось выполнить действие'
}

function toQuery(filters: MovementFilters): accountingApi.MoneyMovementFilters {
  const range = dateFilterRange(filters.period)
  return {
    direction: filters.direction === 'all' ? undefined : filters.direction,
    subkind: filters.subkind === 'all' ? undefined : filters.subkind,
    status: filters.status === 'all' ? undefined : filters.status,
    source_kind: filters.source_kind === 'all' ? undefined : filters.source_kind,
    date_from: range ? range[0].toISOString() : undefined,
    date_to: range ? range[1].toISOString() : undefined,
  }
}

export const useAccountingStore = create<AccountingState>((set, get) => ({
  movements: [],
  enums: null,
  clients: [],
  loading: true,
  filters: DEFAULT_FILTERS,

  load: async () => {
    set({ loading: true })
    const [movements, enums, clients] = await Promise.all([
      accountingApi.listMovements(toQuery(get().filters)),
      get().enums ? Promise.resolve(get().enums!) : accountingApi.getEnums(),
      get().clients.length ? Promise.resolve(null) : listClients().catch(() => null),
    ])
    set((state) => ({
      movements,
      enums,
      loading: false,
      clients: clients
        ? clients.map((c) => ({ id: c.id, name: c.full_name })).sort((a, b) => a.name.localeCompare(b.name, 'ru'))
        : state.clients,
    }))
  },

  setFilters: (patch) => {
    set({ filters: { ...get().filters, ...patch } })
    get().load()
  },

  resetFilters: () => {
    set({ filters: DEFAULT_FILTERS })
    get().load()
  },

  create: async (input) => {
    try {
      const created = await accountingApi.createMovement(input)
      set({ movements: [created, ...get().movements] })
      return { ok: true }
    } catch (error) {
      return { ok: false, reason: reasonOf(error) }
    }
  },

  changeStatus: async (id, to, reason) => {
    try {
      const updated = await accountingApi.changeStatus(id, to, reason)
      set({ movements: get().movements.map((m) => (m.id === id ? updated : m)) })
      return { ok: true }
    } catch (error) {
      return { ok: false, reason: reasonOf(error) }
    }
  },

  remove: async (id) => {
    try {
      await accountingApi.deleteMovement(id)
      set({ movements: get().movements.filter((m) => m.id !== id) })
      return { ok: true }
    } catch (error) {
      return { ok: false, reason: reasonOf(error) }
    }
  },
}))
